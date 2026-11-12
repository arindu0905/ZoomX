import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT, mergeContent } from "@/services/wordpress/content";
import { verifyWordPressSignature } from "@/lib/security";
import { createHmac } from "node:crypto";

describe("mergeContent", () => {
  it("keeps the built-in copy when WordPress has nothing", () => {
    expect(mergeContent(null)).toEqual(DEFAULT_CONTENT);
    expect(mergeContent({})).toEqual(DEFAULT_CONTENT);
  });

  it("overlays only the fields that were edited", () => {
    const merged = mergeContent({ hero: { title: "Fresh homes, happy families." } });
    expect(merged.hero.title).toBe("Fresh homes, happy families.");
    expect(merged.hero.lead).toBe(DEFAULT_CONTENT.hero.lead);
    expect(merged.business).toEqual(DEFAULT_CONTENT.business);
  });

  it("hides the announcement only when told to", () => {
    expect(mergeContent({ announcement: false }).announcement).toBeNull();
    expect(mergeContent({ announcement: null }).announcement).toEqual(DEFAULT_CONTENT.announcement);
    expect(mergeContent({ announcement: { message: "Hi" } }).announcement).toEqual({ message: "Hi" });
  });
});

describe("verifyWordPressSignature", () => {
  const secret = "s".repeat(40);
  const body = '{"tags":["content"]}';
  const now = 1_800_000_000_000;
  const ts = String(now / 1000);
  const sig = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");

  it("accepts a fresh, correctly signed request", () => {
    expect(verifyWordPressSignature(body, ts, sig, secret, now)).toBe(true);
  });

  it("rejects tampering, wrong secrets and stale timestamps", () => {
    expect(verifyWordPressSignature(body + " ", ts, sig, secret, now)).toBe(false);
    expect(verifyWordPressSignature(body, ts, sig, "x".repeat(40), now)).toBe(false);
    expect(verifyWordPressSignature(body, ts, sig, secret, now + 301_000)).toBe(false);
    expect(verifyWordPressSignature(body, null, sig, secret, now)).toBe(false);
  });
});
