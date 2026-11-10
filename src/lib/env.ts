import "server-only";
import { z } from "zod";

/**
 * Server-only environment configuration.
 *
 * Every integration secret is optional at boot because WooCommerce and the
 * payment gateways are not provisioned yet (see docs/PHASE-1-AUDIT.md).
 * Code that needs one calls `requireEnv(...)`, which fails loudly and safely
 * at the point of use instead of silently falling back to fake behaviour.
 */
const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const optionalUrl = optionalString.pipe(
  z.url({ protocol: /^https?$/ }).optional(),
);

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // WooCommerce — the single source of truth for commerce data.
  WOOCOMMERCE_STORE_URL: optionalUrl,
  WOOCOMMERCE_CONSUMER_KEY: optionalString,
  WOOCOMMERCE_CONSUMER_SECRET: optionalString,
  WOOCOMMERCE_WEBHOOK_SECRET: optionalString,
  WOOCOMMERCE_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10_000),

  // On-demand revalidation (manual trigger, separate from webhooks).
  REVALIDATE_SECRET: optionalString,

  // Signs the HttpOnly cookie that wraps the WooCommerce Cart-Token.
  SESSION_SECRET: optionalString.pipe(
    z.string().min(32, "SESSION_SECRET must be at least 32 characters").optional(),
  ),

  // PayHere
  PAYHERE_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYHERE_MERCHANT_ID: optionalString,
  PAYHERE_MERCHANT_SECRET: optionalString,

  // WEBXPAY (only if the business confirms it is required)
  WEBXPAY_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  WEBXPAY_API_KEY: optionalString,
  WEBXPAY_SECRET: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    // Report variable names and reasons only — never values.
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid server environment configuration:\n${issues}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}

export class MissingConfigurationError extends Error {
  constructor(public readonly keys: string[]) {
    super(`Missing required configuration: ${keys.join(", ")}`);
    this.name = "MissingConfigurationError";
  }
}

/** Returns the requested variables, throwing if any are unset. */
export function requireEnv<K extends keyof ServerEnv>(
  ...keys: K[]
): { [P in K]-?: NonNullable<ServerEnv[P]> } {
  const env = getServerEnv();
  const missing = keys.filter((k) => env[k] === undefined);
  if (missing.length) throw new MissingConfigurationError(missing as string[]);
  return Object.fromEntries(keys.map((k) => [k, env[k]])) as {
    [P in K]-?: NonNullable<ServerEnv[P]>;
  };
}
