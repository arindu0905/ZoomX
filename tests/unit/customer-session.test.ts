import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
const { decodeSession, encodeSession } = await import("@/services/auth/session");
const { signValue } = await import("@/lib/security");

const KEY = "k".repeat(64);
const future = Math.floor(Date.now() / 1000) + 3600;

describe("customer session cookie", () => {
  it("round-trips the customer id", () => {
    const raw = encodeSession({ customerId: 42, exp: future }, KEY);
    expect(decodeSession(raw, KEY)).toEqual({ customerId: 42, exp: future });
  });

  it("rejects tampering, other keys and expired sessions", () => {
    const raw = encodeSession({ customerId: 42, exp: future }, KEY);
    const forged = Buffer.from(JSON.stringify({ c: 1, e: future })).toString("base64url") + raw.slice(raw.indexOf("."));
    expect(decodeSession(forged, KEY)).toBeNull();
    expect(decodeSession(raw, "x".repeat(64))).toBeNull();
    expect(decodeSession(encodeSession({ customerId: 42, exp: 1 }, KEY), KEY)).toBeNull();
    expect(decodeSession(undefined, KEY)).toBeNull();
  });

  it("rejects well-signed but malformed payloads", () => {
    const bad = signValue(Buffer.from(JSON.stringify({ c: "42", e: future })).toString("base64url"), KEY);
    expect(decodeSession(bad, KEY)).toBeNull();
    expect(decodeSession(signValue("not-base64-json", KEY), KEY)).toBeNull();
  });
});
