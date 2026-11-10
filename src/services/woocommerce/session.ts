import "server-only";
import { cookies } from "next/headers";
import { requireEnv, getServerEnv } from "@/lib/env";
import { jwtSecondsRemaining, signValue, verifySignedValue } from "@/lib/security";

/**
 * The customer's WooCommerce cart session.
 *
 * WooCommerce identifies a Store API cart by its `Cart-Token` (a JWT it
 * issues). We keep it in our own HttpOnly cookie, HMAC-signed with
 * SESSION_SECRET so a tampered value is discarded rather than forwarded.
 * The browser never sees the token from JavaScript and never calls
 * WooCommerce directly.
 */

export const CART_COOKIE = "zx_cart";
const DEFAULT_MAX_AGE = 60 * 60 * 48; // WooCommerce's default cart session length
const MAX_MAX_AGE = 60 * 60 * 24 * 30;

export async function readCartToken(): Promise<string | null> {
  const { SESSION_SECRET } = requireEnv("SESSION_SECRET");
  const raw = (await cookies()).get(CART_COOKIE)?.value;
  const token = verifySignedValue(raw, SESSION_SECRET);
  if (!token) return null;
  const remaining = jwtSecondsRemaining(token);
  return remaining !== null && remaining <= 0 ? null : token;
}

/** Only callable from Route Handlers / Server Functions (cookie writes). */
export async function writeCartToken(token: string): Promise<void> {
  const { SESSION_SECRET } = requireEnv("SESSION_SECRET");
  const remaining = jwtSecondsRemaining(token);
  const maxAge = Math.min(MAX_MAX_AGE, remaining && remaining > 0 ? remaining : DEFAULT_MAX_AGE);
  (await cookies()).set(CART_COOKIE, signValue(token, SESSION_SECRET), {
    httpOnly: true,
    secure: getServerEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function clearCartToken(): Promise<void> {
  (await cookies()).delete(CART_COOKIE);
}
