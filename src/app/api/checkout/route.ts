import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { checkoutSchema, toWooAddress } from "@/lib/checkout-schema";
import { isKnownPaymentMethod } from "@/lib/payment-methods";
import { getConfiguredPaymentMethods } from "@/services/payments/methods";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getCustomerSession } from "@/services/auth/session";
import { getCart, placeOrder } from "@/services/woocommerce/cart";
import { updateOrder } from "@/services/woocommerce/orders";

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
  if (!rateLimit(`checkout:${clientIp(request.headers)}`, 20, 60_000)) {
    return apiError(429, "rate_limited", "Too many attempts. Please wait a minute and try again.");
  }

  const body = await readJson(request, checkoutSchema);
  if ("response" in body) return body.response;
  const data = body.data;

  if (!isKnownPaymentMethod(data.paymentMethod) || !getConfiguredPaymentMethods().includes(data.paymentMethod)) {
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

    // Signed-in customer: attach the order to their account (id from the
    // signed session only). The Store API cart is a guest session, so
    // WooCommerce creates the order as a guest order first.
    const session = await getCustomerSession();
    if (session) {
      try {
        await updateOrder(order.order_id, { customer_id: session.customerId });
      } catch (err) {
        console.error("[checkout] could not link order to customer:", err instanceof Error ? err.message : "unknown");
      }
    }

    // Our own URLs — never WooCommerce's redirect_url. Note that WooCommerce's
    // payment_status "success" only means the order was created; for PayHere
    // the order stays "pending" until a verified PayHere notification.
    const key = encodeURIComponent(order.order_key);
    const next =
      data.paymentMethod === "zoomx_payhere"
        ? `/checkout/pay/${order.order_id}?key=${key}`
        : `/checkout/order/${order.order_id}?key=${key}`;
    return apiOk<CheckoutResponse>({ orderId: order.order_id, next }, 201);
  } catch (err) {
    return handleApiError("checkout", err);
  }
}
