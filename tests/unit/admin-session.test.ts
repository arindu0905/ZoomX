import { describe, expect, it } from "vitest";
import { decodeAdminSession, encodeAdminSession } from "@/services/admin/session";

const secret = "k".repeat(64);
const now = 1_800_000_000_000;

describe("admin session cookie", () => {
  it("round-trips the staff user id until it expires", () => {
    const cookie = encodeAdminSession(7, now / 1000 + 60, secret);
    expect(decodeAdminSession(cookie, secret, now)).toBe(7);
    expect(decodeAdminSession(cookie, secret, now + 61_000)).toBeNull();
  });

  it("rejects tampering and a different key", () => {
    const cookie = encodeAdminSession(7, now / 1000 + 60, secret);
    const [value, sig] = cookie.split(".");
    const forged = `${Buffer.from(JSON.stringify({ u: 1, e: now / 1000 + 60 })).toString("base64url")}.${sig}`;
    expect(decodeAdminSession(forged, secret, now)).toBeNull();
    expect(decodeAdminSession(`${value}.${sig}`, "x".repeat(64), now)).toBeNull();
    expect(decodeAdminSession(undefined, secret, now)).toBeNull();
  });
});
