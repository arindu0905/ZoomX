import { describe, expect, it } from "vitest";
import { findVariant, isOptionAvailable, optionExists, type VariantLike } from "@/lib/variations";

const v = (id: number, attributes: Record<string, string>, inStock = true): VariantLike => ({
  id,
  attributes,
  inStock,
  purchasable: true,
});

const variants = [
  v(1, { Size: "500 ml", Scent: "Lemon" }),
  v(2, { Size: "1 L", Scent: "Lemon" }),
  v(3, { Size: "1 L", Scent: "Lavender" }, false),
  v(4, { Size: "2 L", Scent: "" }), // any scent
];
const names = ["Size", "Scent"];

describe("findVariant", () => {
  it("requires every attribute to be chosen", () => {
    expect(findVariant(variants, { Size: "1 L" }, names)).toBeUndefined();
  });

  it("matches exact terms case-insensitively", () => {
    expect(findVariant(variants, { Size: "1 l", Scent: "lemon" }, names)?.id).toBe(2);
  });

  it("treats an empty variation value as 'any'", () => {
    expect(findVariant(variants, { Size: "2 L", Scent: "Lavender" }, names)?.id).toBe(4);
  });

  it("returns undefined for a combination that does not exist", () => {
    expect(findVariant(variants, { Size: "500 ml", Scent: "Lavender" }, names)).toBeUndefined();
  });

  it("matches taxonomy terms by slug alias", () => {
    const tax = [v(9, { Size: "one-litre" })];
    const aliases = new Map([["1 l", "one-litre"]]);
    expect(findVariant(tax, { Size: "1 L" }, ["Size"], aliases)?.id).toBe(9);
  });
});

describe("isOptionAvailable", () => {
  it("is false when the only matching variation is out of stock", () => {
    expect(isOptionAvailable(variants, { Size: "1 L" }, "Scent", "Lavender")).toBe(false);
    expect(isOptionAvailable(variants, { Size: "1 L" }, "Scent", "Lemon")).toBe(true);
  });

  it("considers other current choices", () => {
    expect(isOptionAvailable(variants, { Scent: "Lavender" }, "Size", "500 ml")).toBe(false);
    expect(isOptionAvailable(variants, { Scent: "Lavender" }, "Size", "2 L")).toBe(true);
  });
});

describe("optionExists", () => {
  it("distinguishes missing terms from out-of-stock ones", () => {
    expect(optionExists(variants, "Scent", "Lavender")).toBe(true);
    expect(optionExists([v(1, { Size: "1 L" })], "Size", "5 L")).toBe(false);
  });
});
