import { describe, expect, it } from "vitest";
import { checkoutSchema, toWooAddress } from "@/lib/checkout-schema";
import { normaliseLkPhone } from "@/lib/sri-lanka";

const address = {
  firstName: "Nimal",
  lastName: "Perera",
  address1: "12 Galle Road",
  city: "Ratmalana",
  district: "Colombo",
  postcode: "10390",
};
const valid = {
  email: "  Buyer@Example.TEST ",
  phone: "077 123 4567",
  billing: address,
  paymentMethod: "cod",
  terms: true,
};

describe("normaliseLkPhone", () => {
  it.each([
    ["0771234567", "+94771234567"],
    ["+94 77 123 4567", "+94771234567"],
    ["94112345678", "+94112345678"],
    ["011-234-5678", "+94112345678"],
  ])("%s → %s", (input, expected) => expect(normaliseLkPhone(input)).toBe(expected));

  it.each(["12345", "077123456", "+447911123456", "0071234567", "phone"])("rejects %s", (input) =>
    expect(normaliseLkPhone(input)).toBeNull(),
  );
});

describe("checkoutSchema", () => {
  it("normalises valid input", () => {
    const r = checkoutSchema.parse(valid);
    expect(r.email).toBe("buyer@example.test");
    expect(r.phone).toBe("+94771234567");
    expect(r.billing.address2).toBe("");
    expect(r.shipToDifferentAddress).toBe(false);
  });

  it("requires terms, a district and a valid postcode", () => {
    const r = checkoutSchema.safeParse({
      ...valid,
      terms: false,
      billing: { ...address, district: "Atlantis", postcode: "123" },
    });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["terms", "billing.district", "billing.postcode"]));
  });

  it("requires a 5-digit postcode (WooCommerce's rule for LK)", () => {
    expect(checkoutSchema.safeParse({ ...valid, billing: { ...address, postcode: "" } }).success).toBe(false);
  });

  it("validates the shipping address only when shipping elsewhere", () => {
    expect(checkoutSchema.safeParse({ ...valid, shipping: { city: "" } }).success).toBe(true);
    const r = checkoutSchema.safeParse({ ...valid, shipToDifferentAddress: true, shipping: { city: "Kandy" } });
    expect(r.success).toBe(false);
    expect(r.error!.issues.some((i) => i.path.join(".") === "shipping.firstName")).toBe(true);
  });

  it("does not accept prices or totals", () => {
    const r = checkoutSchema.parse({ ...valid, total: "1", prices: [] });
    expect(r).not.toHaveProperty("total");
  });
});

describe("toWooAddress", () => {
  it("maps to the WooCommerce shape with the district as state", () => {
    const a = checkoutSchema.parse(valid);
    expect(toWooAddress(a.billing, a.phone, a.email)).toMatchObject({
      address_1: "12 Galle Road",
      state: "Colombo",
      country: "LK",
      email: "buyer@example.test",
      phone: "+94771234567",
    });
  });
});
