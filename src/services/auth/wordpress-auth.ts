import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { getServerEnv, requireEnv } from "@/lib/env";
import { decodeEntities } from "@/utils/text";

/**
 * Signed server-to-server calls to the zoomx-headless WordPress plugin
 * (`/wp-json/zoomx/v1/auth/*`). WordPress core verifies and stores passwords;
 * this module only relays them over HTTPS and never logs or stores them.
 */

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

const customerSchema = z.object({
  id: z.number().int().positive(),
  email: z.string(),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
});
export type AuthCustomer = z.infer<typeof customerSchema>;

/** Signed POST to the zoomx-headless plugin (also used by the admin dashboard). */
export async function wpSignedCall<S extends z.ZodType>(path: string, body: Record<string, unknown>, schema: S): Promise<z.infer<S>> {
  const { WOOCOMMERCE_STORE_URL, WORDPRESS_AUTH_SECRET } = requireEnv("WOOCOMMERCE_STORE_URL", "WORDPRESS_AUTH_SECRET");
  const raw = JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", WORDPRESS_AUTH_SECRET).update(`${ts}.${raw}`).digest("hex");

  let res: Response;
  try {
    res = await fetch(new URL(`/wp-json/zoomx/v1/${path}`, WOOCOMMERCE_STORE_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-ZoomX-Timestamp": ts,
        "X-ZoomX-Signature": signature,
      },
      body: raw,
      cache: "no-store",
      signal: AbortSignal.timeout(getServerEnv().WOOCOMMERCE_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new AuthError("We couldn’t reach the shop. Please try again.", 504, "upstream_error");
  }

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = z.object({ code: z.string(), message: z.string() }).safeParse(json);
    // Only the plugin's own customer-facing codes pass through; anything else is generic.
    const known = [
      "invalid_credentials",
      "registration_failed",
      "registration_disabled",
      "invalid_key",
      "invalid_request",
    ];
    if (err.success && known.includes(err.data.code)) {
      throw new AuthError(decodeEntities(err.data.message), res.status, err.data.code);
    }
    console.error(`[auth] ${path}: WordPress responded ${res.status}`);
    throw new AuthError("Something went wrong. Please try again.", 502, "upstream_error");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new AuthError("Something went wrong. Please try again.", 502, "upstream_error");
  return parsed.data;
}

export const wpLogin = (login: string, password: string) => wpSignedCall("auth/login", { login, password }, customerSchema);

export const wpRegister = (input: { email: string; password: string; firstName: string; lastName: string }) =>
  wpSignedCall(
    "auth/register",
    { email: input.email, password: input.password, first_name: input.firstName, last_name: input.lastName },
    customerSchema,
  );

export const wpLostPassword = (login: string) =>
  wpSignedCall("auth/lost-password", { login }, z.object({ ok: z.literal(true) }));

export const wpResetPassword = (login: string, key: string, password: string) =>
  wpSignedCall("auth/reset-password", { login, key, password }, z.object({ ok: z.literal(true) }));
