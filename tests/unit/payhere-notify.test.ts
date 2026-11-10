import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { expectedNotifySignature } = await import("@/services/payments/payhere-core");
const { processPayHereNotification } = await import("@/services/payments/payhere-notify");
import type { Order } from "@/types/order";

// Fixtures only — not real credentials.
const MERCHANT = "1210000";
const SECRET = "test-secret-not-real";

const baseOrder = (over: Partial<Order> = {}): Order => ({
  id: 20,
  number: "20",
  order_key: "wc_order_abc123",
  status: "pending",
  currency: "LKR",
  date_created: "2026-11-10T10:00:00",
  date_paid: null,
  total: "1450.00",
  discount_total: "0.00",
  shipping_total: "350.00",
  total_tax: "0.00",
  payment_method: "zoomx_payhere",
  payment_method_title: "PayHere",
  transaction_id: "",
  customer_id: 0,
  customer_note: "",
  billing: {
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
  },
  shipping: {
    first_name: "",
    last_name: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    postcode: "",
    country: "",
  },
  line_items: [],
  shipping_lines: [],
  coupon_lines: [],
  meta_data: [],
  ...over,
});

function notification(over: Record<string, string> = {}) {
  const n = {
    merchant_id: MERCHANT,
    order_id: "20",
    payment_id: "320025071278",
    payhere_amount: "1450.00",
    payhere_currency: "LKR",
    status_code: "2",
    md5sig: "",
    method: "VISA",
    ...over,
  };
  return { ...n, md5sig: over.md5sig ?? expectedNotifySignature(n, SECRET) };
}

let order: Order | null;
const deps = {
  merchantId: MERCHANT,
  secret: SECRET,
  getOrder: vi.fn(async () => order),
  updateOrder: vi.fn(async () => {}),
  addNote: vi.fn(async () => {}),
};

beforeEach(() => {
  order = baseOrder();
  vi.clearAllMocks();
});

describe("processPayHereNotification", () => {
  it("marks a pending order paid on a verified success", async () => {
    expect(await processPayHereNotification(notification(), deps)).toEqual({ http: 200, result: "paid" });
    expect(deps.updateOrder).toHaveBeenCalledWith(20, {
      status: "processing",
      set_paid: true,
      transaction_id: "320025071278",
    });
  });

  it("rejects a bad signature without touching the order", async () => {
    const r = await processPayHereNotification(notification({ md5sig: "0".repeat(32) }), deps);
    expect(r).toMatchObject({ http: 401, result: "rejected" });
    expect(deps.getOrder).not.toHaveBeenCalled();
    expect(deps.updateOrder).not.toHaveBeenCalled();
  });

  it("rejects a tampered amount (signature no longer matches)", async () => {
    const n = { ...notification(), payhere_amount: "1.00" };
    expect(await processPayHereNotification(n, deps)).toMatchObject({ http: 401 });
  });

  it("rejects another merchant's notification", async () => {
    expect(await processPayHereNotification(notification({ merchant_id: "999" }), deps)).toMatchObject({ http: 400 });
  });

  it("holds the order, unpaid, if the signed amount differs from the order total", async () => {
    const r = await processPayHereNotification(notification({ payhere_amount: "1000.00" }), deps);
    expect(r).toEqual({ http: 200, result: "on_hold" });
    expect(deps.updateOrder).toHaveBeenCalledWith(20, { status: "on-hold" });
    expect(deps.updateOrder).not.toHaveBeenCalledWith(20, expect.objectContaining({ set_paid: true }));
  });

  it("holds the order if the currency differs", async () => {
    expect(await processPayHereNotification(notification({ payhere_currency: "USD" }), deps)).toEqual({
      http: 200,
      result: "on_hold",
    });
  });

  it("is idempotent for duplicate success notifications", async () => {
    order = baseOrder({ status: "processing", date_paid: "2026-11-10T10:05:00", transaction_id: "320025071278" });
    expect(await processPayHereNotification(notification(), deps)).toEqual({ http: 200, result: "duplicate" });
    expect(deps.updateOrder).not.toHaveBeenCalled();
    expect(deps.addNote).not.toHaveBeenCalled();
  });

  it("flags a second, different successful payment instead of re-paying", async () => {
    order = baseOrder({ status: "processing", date_paid: "2026-11-10T10:05:00", transaction_id: "111" });
    expect(await processPayHereNotification(notification(), deps)).toEqual({ http: 200, result: "duplicate" });
    expect(deps.updateOrder).not.toHaveBeenCalled();
    expect(deps.addNote).toHaveBeenCalledWith(20, expect.stringMatching(/double charge/));
  });

  it("marks failed payments failed, but never downgrades a paid order", async () => {
    expect(await processPayHereNotification(notification({ status_code: "-2" }), deps)).toEqual({
      http: 200,
      result: "failed",
    });
    expect(deps.updateOrder).toHaveBeenCalledWith(20, { status: "failed" });

    vi.clearAllMocks();
    order = baseOrder({ status: "processing", date_paid: "2026-11-10T10:05:00" });
    expect(await processPayHereNotification(notification({ status_code: "-2" }), deps)).toEqual({
      http: 200,
      result: "noted",
    });
    expect(deps.updateOrder).not.toHaveBeenCalled();
  });

  it("leaves cancelled and pending payments pending (note only)", async () => {
    for (const status_code of ["-1", "0"]) {
      vi.clearAllMocks();
      expect(await processPayHereNotification(notification({ status_code }), deps)).toEqual({
        http: 200,
        result: "noted",
      });
      expect(deps.updateOrder).not.toHaveBeenCalled();
      expect(deps.addNote).toHaveBeenCalledOnce();
    }
  });

  it("puts charged-back orders on hold", async () => {
    order = baseOrder({ status: "processing", date_paid: "2026-11-10T10:05:00" });
    expect(await processPayHereNotification(notification({ status_code: "-3" }), deps)).toEqual({
      http: 200,
      result: "on_hold",
    });
  });

  it("ignores orders that don't use PayHere and unknown orders", async () => {
    order = baseOrder({ payment_method: "cod" });
    expect(await processPayHereNotification(notification(), deps)).toMatchObject({ http: 409 });
    order = null;
    expect(await processPayHereNotification(notification(), deps)).toMatchObject({ http: 404 });
    expect(deps.updateOrder).not.toHaveBeenCalled();
  });
});
