import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison (false on length mismatch without leaking timing on content). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab); // keep timing roughly uniform
    return false;
  }
  return timingSafeEqual(ab, bb);
}

const hmac = (value: string, secret: string) => createHmac("sha256", secret).update(value).digest("base64url");

/** `value.signature` — tamper-evident, not encrypted. */
export function signValue(value: string, secret: string): string {
  return `${value}.${hmac(value, secret)}`;
}

/** Returns the original value if the signature is valid, otherwise null. */
export function verifySignedValue(signed: string | undefined, secret: string): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  return safeEqual(signed.slice(i + 1), hmac(value, secret)) ? value : null;
}

/**
 * WooCommerce webhooks send `X-WC-Webhook-Signature`:
 * base64(HMAC-SHA256(raw request body, webhook secret)).
 */
export function verifyWooWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  return safeEqual(signature.trim(), expected);
}

/**
 * CSRF defence for cookie-authenticated mutations: the request must come
 * from our own origin. Browsers always send `Origin` on cross-site POSTs, and
 * `Sec-Fetch-Site` where supported.
 */
export function isSameOriginRequest(headers: Headers, expectedOrigin: string): boolean {
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = headers.get("origin");
  if (!origin) return site === "same-origin";
  try {
    return new URL(origin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

/** Seconds until a JWT's `exp`, or null if absent/unreadable. Does NOT verify the token. */
export function jwtSecondsRemaining(token: string, now = Date.now()): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof payload.exp === "number" ? Math.floor(payload.exp - now / 1000) : null;
  } catch {
    return null;
  }
}
