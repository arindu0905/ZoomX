import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  checkoutHash,
  decimalToMinor,
  expectedNotifySignature,
  formatPayHereAmount,
} from "@/services/payments/payhere-core";

// Independent re-statement of the documented PHP sample, to cross-check our implementation:
// strtoupper(md5($merchant_id . $order_id . number_format($amount, 2, '.', '') . $currency . strtoupper(md5($merchant_secret))))
const md5 = (s: string) => createHash("md5").update(s).digest("hex");
const phpHash = (id: string, order: string, amount: string, cur: string, secret: string) =>
  md5(id + order + amount + cur + md5(secret).toUpperCase()).toUpperCase();

// Test fixtures only — not credentials.
const MERCHANT = "1210000";
const SECRET = "test-secret-not-real";

describe("amount handling", () => {
  it.each([
    ["1450", "1450.00"],
    ["1450.5", "1450.50"],
    ["1450.00", "1450.00"],
    ["0.07", "0.07"],
    ["1234567.89", "1234567.89"],
  ])("%s → %s", (input, out) => expect(formatPayHereAmount(input)).toBe(out));

  it("rejects malformed amounts and excess precision", () => {
    expect(() => formatPayHereAmount("1,450.00")).toThrow();
    expect(decimalToMinor("-1")).toBeNull();
    expect(decimalToMinor("1.005")).toBeNull();
    expect(decimalToMinor("1.500")).toBe(150);
  });
});

describe("checkoutHash", () => {
  it("matches the documented formula", () => {
    expect(checkoutHash(MERCHANT, "20", "1450", "LKR", SECRET)).toBe(phpHash(MERCHANT, "20", "1450.00", "LKR", SECRET));
  });

  it("changes with any input", () => {
    const base = checkoutHash(MERCHANT, "20", "1450.00", "LKR", SECRET);
    expect(checkoutHash(MERCHANT, "21", "1450.00", "LKR", SECRET)).not.toBe(base);
    expect(checkoutHash(MERCHANT, "20", "1450.01", "LKR", SECRET)).not.toBe(base);
    expect(checkoutHash(MERCHANT, "20", "1450.00", "USD", SECRET)).not.toBe(base);
  });
});

describe("expectedNotifySignature", () => {
  it("matches the documented md5sig formula", () => {
    const n = {
      merchant_id: MERCHANT,
      order_id: "20",
      payment_id: "320025071278",
      payhere_amount: "1450.00",
      payhere_currency: "LKR",
      status_code: "2",
      md5sig: "",
    };
    const expected = md5(MERCHANT + "20" + "1450.00" + "LKR" + "2" + md5(SECRET).toUpperCase()).toUpperCase();
    expect(expectedNotifySignature(n, SECRET)).toBe(expected);
    expect(expectedNotifySignature({ ...n, status_code: "-2" }, SECRET)).not.toBe(expected);
  });
});
