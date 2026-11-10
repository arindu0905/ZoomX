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
