import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
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
  (await cookies()).delete(ADMIN_COOKIE);
}

/** The signed-in staff member (re-confirmed with WordPress), or null. */
export async function getStaff(): Promise<Staff | null> {
  if (!getServerEnv().SESSION_SECRET) return null;
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  await connection();
  const id = decodeAdminSession(raw);
  if (!id) return null;
  try {
    return await wpSignedCall("admin/staff", { id }, staffSchema);
  } catch (err) {
    if (!(err instanceof AuthError)) console.error("[admin] staff check failed");
    return null;
  }
}

/** For admin pages and Server Actions: the staff member, or redirect to sign-in. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}
