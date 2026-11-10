import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { trackSchema } from "@/lib/account-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findOrderByNumberAndEmail } from "@/services/woocommerce/customers";

/**
 * Guest order tracking: order number + billing email. On a match, returns the
 * order's own key-protected status page; otherwise one generic answer.
 */
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  if (!rateLimit(`track:${clientIp(request.headers)}`, 10, 15 * 60_000)) {
    return apiError(429, "rate_limited", "Too many attempts. Please wait 15 minutes and try again.");
  }
  const body = await readJson(request, trackSchema);
  if ("response" in body) return body.response;
  try {
    const order = await findOrderByNumberAndEmail(body.data.orderNumber, body.data.email);
    if (!order) {
      return apiError(404, "not_found", "We couldn’t find an order with that number and email.");
    }
    return apiOk({ next: `/checkout/order/${order.id}?key=${encodeURIComponent(order.order_key)}` });
  } catch (err) {
    return handleApiError("track", err);
  }
}
