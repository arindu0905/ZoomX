import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { applyCoupon } from "@/services/woocommerce/cart";

const schema = z.object({ code: z.string().trim().min(1).max(50) });

/** WooCommerce validates the coupon and recalculates the discount. */
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  // Slows coupon-code guessing.
  if (!rateLimit(`coupon:${clientIp(request.headers)}`, 10, 60_000)) {
    return apiError(429, "rate_limited", "Too many attempts. Please wait a minute and try again.");
  }
  const body = await readJson(request, schema);
  if ("response" in body) return body.response;
  try {
    return apiOk({ cart: await applyCoupon(body.data.code) });
  } catch (err) {
    return handleApiError("coupon apply", err);
  }
}
