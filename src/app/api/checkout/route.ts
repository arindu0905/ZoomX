import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { checkoutSchema, toWooAddress } from "@/lib/checkout-schema";
import { isSupportedPaymentMethod } from "@/lib/payment-methods";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getCart, placeOrder } from "@/services/woocommerce/cart";

export interface CheckoutResponse {
  orderId: number;
  /** Where to send the customer next (our confirmation page). */
  next: string;
}

/**
 * Places the order. Everything is re-validated here; the browser sends only
 * contact details, addresses, a note and the chosen method. WooCommerce
 * creates the order from the session cart and computes every amount.
 */
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  if (!rateLimit(`checkout:${clientIp(request.headers)}`, 10, 60_000)) {
    return apiError(429, "rate_limited", "Too many attempts. Please wait a minute and try again.");
  }

  const body = await readJson(request, checkoutSchema);
  if ("response" in body) return body.response;
  const data = body.data;

  if (!isSupportedPaymentMethod(data.paymentMethod)) {
    return apiError(400, "payment_method_unavailable", "That payment method isn’t available.");
  }

  try {
    const cart = await getCart();
    if (cart.items_count === 0) return apiError(409, "empty_cart", "Your bag is empty.");
    if (cart.errors.length) return apiError(409, cart.errors[0].code, cart.errors[0].message);
    if (!cart.payment_methods.includes(data.paymentMethod)) {
      return apiError(400, "payment_method_unavailable", "That payment method isn’t available.");
    }

    const billing = toWooAddress(data.billing, data.phone, data.email);
    const shipping = data.shipping ? toWooAddress(data.shipping, data.phone) : billing;

    const order = await placeOrder({
      billing_address: billing,
      shipping_address: shipping,
      customer_note: data.note,
      payment_method: data.paymentMethod,
    });

    if (order.payment_result?.payment_status === "failure" || order.status === "failed") {
      return apiError(402, "payment_failed", "We couldn’t place your order. Please try again.");
    }

    // Our own confirmation URL — never WooCommerce's redirect_url, and the
    // page re-reads the order from WooCommerce rather than trusting this response.
    const next = `/checkout/order/${order.order_id}?key=${encodeURIComponent(order.order_key)}`;
    return apiOk<CheckoutResponse>({ orderId: order.order_id, next }, 201);
  } catch (err) {
    return handleApiError("checkout", err);
  }
}
