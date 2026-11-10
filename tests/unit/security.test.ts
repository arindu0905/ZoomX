import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { isSameOriginRequest, jwtSecondsRemaining, signValue, verifySignedValue, verifyWooWebhookSignature } =
  await import("@/lib/security");

const SECRET = "x".repeat(40);

describe("signed values", () => {
  it("round-trips and rejects tampering", () => {
    const signed = signValue("abc.def", SECRET);
    expect(verifySignedValue(signed, SECRET)).toBe("abc.def");
    expect(verifySignedValue(signed.replace("abc", "abd"), SECRET)).toBeNull();
    expect(verifySignedValue(signed, "y".repeat(40))).toBeNull();
    expect(verifySignedValue("no-signature", SECRET)).toBeNull();
    expect(verifySignedValue(undefined, SECRET)).toBeNull();
  });
});

describe("verifyWooWebhookSignature", () => {
  const body = JSON.stringify({ id: 12, name: "Thing" });
  const sig = createHmac("sha256", SECRET).update(body).digest("base64");

  it("accepts the WooCommerce signature", () => {
    expect(verifyWooWebhookSignature(body, sig, SECRET)).toBe(true);
  });

  it("rejects a modified body, wrong secret or missing header", () => {
    expect(verifyWooWebhookSignature(body + " ", sig, SECRET)).toBe(false);
    expect(verifyWooWebhookSignature(body, sig, "z".repeat(40))).toBe(false);
    expect(verifyWooWebhookSignature(body, null, SECRET)).toBe(false);
  });
});

describe("isSameOriginRequest", () => {
  const site = "https://zoomx.lk";
  const h = (init: Record<string, string>) => new Headers(init);

  it("allows same-origin requests", () => {
    expect(isSameOriginRequest(h({ origin: "https://zoomx.lk", "sec-fetch-site": "same-origin" }), site)).toBe(true);
    expect(isSameOriginRequest(h({ origin: "https://zoomx.lk" }), site)).toBe(true);
  });

  it("blocks cross-site and missing-origin requests", () => {
    expect(isSameOriginRequest(h({ origin: "https://evil.example" }), site)).toBe(false);
    expect(isSameOriginRequest(h({ origin: "https://zoomx.lk", "sec-fetch-site": "cross-site" }), site)).toBe(false);
    expect(isSameOriginRequest(h({}), site)).toBe(false);
  });
});

describe("jwtSecondsRemaining", () => {
  it("reads exp without verifying", () => {
    const payload = Buffer.from(JSON.stringify({ exp: 1_000 })).toString("base64url");
    expect(jwtSecondsRemaining(`h.${payload}.s`, 400_000)).toBe(600);
    expect(jwtSecondsRemaining("garbage")).toBeNull();
  });
});
