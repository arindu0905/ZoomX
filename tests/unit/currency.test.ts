import { describe, expect, it } from "vitest";
import { formatPrice } from "@/utils/currency";

describe("formatPrice", () => {
  it("formats Store API minor units as LKR", () => {
    expect(formatPrice({ amount: "125000", minorUnit: 2 })).toBe("LKR 1,250.00");
  });

  it("supports zero-decimal stores", () => {
    expect(formatPrice({ amount: "1250", minorUnit: 0 })).toBe("LKR 1,250");
  });

  it("rejects non-numeric amounts", () => {
    expect(() => formatPrice({ amount: "abc", minorUnit: 2 })).toThrow(TypeError);
  });
});

describe("formatDecimalPrice", () => {
  it("formats REST v3 decimal strings without float maths", async () => {
    const { formatDecimalPrice } = await import("@/utils/currency");
    expect(formatDecimalPrice("1250.00")).toBe(formatDecimalPrice("1250"));
    expect(formatDecimalPrice("0.1")).toMatch(/0\.10$/);
    expect(() => formatDecimalPrice("12,50")).toThrow();
  });
});
