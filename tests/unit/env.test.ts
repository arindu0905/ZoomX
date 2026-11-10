import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env";

describe("parseServerEnv", () => {
  it("accepts an empty environment while integrations are unprovisioned", () => {
    const env = parseServerEnv({});
    expect(env.PAYHERE_MODE).toBe("sandbox");
    expect(env.WOOCOMMERCE_STORE_URL).toBeUndefined();
    expect(env.WOOCOMMERCE_REQUEST_TIMEOUT_MS).toBe(10_000);
  });

  it("treats blank strings as unset", () => {
    const env = parseServerEnv({ WOOCOMMERCE_CONSUMER_KEY: "  ", WOOCOMMERCE_STORE_URL: "" });
    expect(env.WOOCOMMERCE_CONSUMER_KEY).toBeUndefined();
    expect(env.WOOCOMMERCE_STORE_URL).toBeUndefined();
  });

  it("rejects a malformed store URL", () => {
    expect(() => parseServerEnv({ WOOCOMMERCE_STORE_URL: "zoomx.lk" })).toThrow(
      /WOOCOMMERCE_STORE_URL/,
    );
  });

  it("rejects an invalid payment mode", () => {
    expect(() => parseServerEnv({ PAYHERE_MODE: "production" })).toThrow(/PAYHERE_MODE/);
  });

  it("rejects a short session secret", () => {
    expect(() => parseServerEnv({ SESSION_SECRET: "short" })).toThrow(/SESSION_SECRET/);
  });

  it("never echoes secret values in error messages", () => {
    const secret = "cs_super_secret_value";
    try {
      parseServerEnv({ WOOCOMMERCE_CONSUMER_SECRET: secret, PAYHERE_MODE: "bad" });
    } catch (e) {
      expect(String(e)).not.toContain(secret);
      return;
    }
    throw new Error("expected parse to fail");
  });
});
