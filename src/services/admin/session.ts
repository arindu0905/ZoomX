import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { after, connection } from "next/server";
import { z } from "zod";
import { getServerEnv, requireEnv } from "@/lib/env";
import { signValue, verifySignedValue } from "@/lib/security";
import { AuthError, wpSignedCall } from "@/services/auth/wordpress-auth";

/**
 * Admin (staff) session for /admin. Separate cookie and signing key from the
 * customer session. Holds only the WordPress user id and an expiry; staff
 * status is re-confirmed with WordPress on every admin page and action, so
 * removing someone's "Shop manager" role locks them out immediately.
 */

export const ADMIN_COOKIE = "zx_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

const staffSchema = z.object({ id: z.number().int().positive(), email: z.string(), name: z.string() });
export type Staff = z.infer<typeof staffSchema>;

const key = () =>
  createHmac("sha256", requireEnv("SESSION_SECRET").SESSION_SECRET).update("zx:admin-session:v1").digest("hex");

export function encodeAdminSession(id: number, exp: number, secret = key()): string {
  return signValue(Buffer.from(JSON.stringify({ u: id, e: exp })).toString("base64url"), secret);
}

export function decodeAdminSession(raw: string | undefined, secret = key(), now = Date.now()): number | null {
  const value = verifySignedValue(raw, secret);
  if (!value) return null;
  try {
    const { u, e } = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { u?: unknown; e?: unknown };
    if (typeof u !== "number" || !Number.isInteger(u) || u <= 0 || typeof e !== "number") return null;
    return e * 1000 > now ? u : null;
  } catch {
    return null;
  }
}

/** Checks a staff sign-in with WordPress. Throws AuthError("invalid_credentials") otherwise. */
export const staffLogin = (login: string, password: string) =>
  wpSignedCall("auth/staff-login", { login, password }, staffSchema);

export async function startAdminSession(id: number): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  (await cookies()).set(ADMIN_COOKIE, encodeAdminSession(id, exp), {
    httpOnly: true,
    secure: getServerEnv().NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession(): Promise<void> {
  const id = decodeAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
  if (id) verified.delete(id);
  (await cookies()).delete(ADMIN_COOKIE);
}

/**
 * Successful staff checks are remembered per server instance so the admin
 * doesn't wait on WordPress for every click. Failed checks are never
 * remembered.
 *
 * - Within STAFF_FRESH_MS of a check: trusted as is.
 * - Page views up to STAFF_STALE_MS after it: shown at once, while the check
 *   is repeated in the background; a failed re-check locks the next request.
 * - Anything that changes data (Server Actions, `strict`) never uses a check
 *   older than STAFF_FRESH_MS — it waits for WordPress.
 *
 * So removing someone's role stops their changes within a minute, and at
 * most one more read-only page view gets through after that.
 */
const STAFF_FRESH_MS = 60_000;
const STAFF_STALE_MS = 10 * 60_000;
const verified = new Map<number, { staff: Staff; checked: number }>();
const checking = new Map<number, Promise<Staff | null>>();

/** Asks WordPress (one call at a time per staff member). */
function checkStaff(id: number): Promise<Staff | null> {
  const running = checking.get(id);
  if (running) return running;
  const check = wpSignedCall("admin/staff", { id }, staffSchema)
    .then((staff) => {
      verified.set(id, { staff, checked: Date.now() });
      return staff as Staff | null;
    })
    .catch((err: unknown) => {
      verified.delete(id);
      if (!(err instanceof AuthError)) console.error("[admin] staff check failed");
      return null;
    })
    .finally(() => checking.delete(id));
  checking.set(id, check);
  return check;
}

async function confirmStaff(id: number, strict: boolean): Promise<Staff | null> {
  const hit = verified.get(id);
  const age = hit ? Date.now() - hit.checked : Infinity;
  if (hit && age < STAFF_FRESH_MS) return hit.staff;
  if (hit && !strict && age < STAFF_STALE_MS) {
    after(() => checkStaff(id).then(() => undefined));
    return hit.staff;
  }
  return checkStaff(id);
}

/** WordPress has just confirmed this person at sign-in: no second check on the first page. */
export function rememberStaff(staff: Staff): void {
  verified.set(staff.id, { staff, checked: Date.now() });
}

/** True if a staff member used the admin on this server instance in the last half hour. */
export function staffActiveRecently(): boolean {
  const cutoff = Date.now() - 30 * 60_000;
  for (const { checked } of verified.values()) if (checked > cutoff) return true;
  return false;
}

/**
 * The signed-in staff member (re-confirmed with WordPress), or null.
 * Wrapped in React cache(): the layout and the page share one check per request.
 */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const id = await sessionStaffId();
  return id ? confirmStaff(id, false) : null;
});

async function sessionStaffId(): Promise<number | null> {
  // Read the request first, even when unconfigured: that is what marks admin
  // pages as per-request. Returning early here made them look static, so a
  // build without SESSION_SECRET tried to prerender the sign-in redirect and failed.
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  await connection();
  if (!getServerEnv().SESSION_SECRET) return null;
  return decodeAdminSession(raw);
}

/** For admin pages: the staff member, or redirect to sign-in. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

/** For Server Actions (anything that saves): never relies on an older check. */
export async function requireStaffStrict(): Promise<Staff> {
  const id = await sessionStaffId();
  const staff = id ? await confirmStaff(id, true) : null;
  if (!staff) redirect("/admin/login");
  return staff;
}
