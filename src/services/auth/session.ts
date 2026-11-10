import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getServerEnv, requireEnv } from "@/lib/env";
import { signValue, verifySignedValue } from "@/lib/security";

/**
 * Customer session: an HMAC-signed, HttpOnly cookie holding only the
 * WooCommerce customer id and an expiry. No passwords or tokens from
 * WordPress are stored. The signing key is derived from SESSION_SECRET with a
 * purpose label, so cart and customer cookies can't be swapped for each other.
 */

export const SESSION_COOKIE = "zx_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export interface CustomerSession {
  customerId: number;
  /** Unix seconds. */
  exp: number;
}

const key = () =>
  createHmac("sha256", requireEnv("SESSION_SECRET").SESSION_SECRET).update("zx:customer-session:v1").digest("hex");

export function encodeSession(s: CustomerSession, secret = key()): string {
  return signValue(Buffer.from(JSON.stringify({ c: s.customerId, e: s.exp })).toString("base64url"), secret);
}

export function decodeSession(raw: string | undefined, secret = key(), now = Date.now()): CustomerSession | null {
  const value = verifySignedValue(raw, secret);
  if (!value) return null;
  try {
    const { c, e } = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { c?: unknown; e?: unknown };
    if (typeof c !== "number" || !Number.isInteger(c) || c <= 0 || typeof e !== "number") return null;
    if (e * 1000 <= now) return null;
    return { customerId: c, exp: e };
  } catch {
    return null;
  }
}

/** The signed-in customer, or null. Reading cookies makes the caller request-time. */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  if (!getServerEnv().SESSION_SECRET) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  // The expiry check reads the clock: mark this as request-time first (Cache Components).
  await connection();
  return decodeSession(raw);
}

/** Route Handlers / Server Functions only. */
export async function startCustomerSession(customerId: number): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  (await cookies()).set(SESSION_COOKIE, encodeSession({ customerId, exp }), {
    httpOnly: true,
    secure: getServerEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endCustomerSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
