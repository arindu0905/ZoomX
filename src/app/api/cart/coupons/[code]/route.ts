import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, handleApiError } from "@/lib/api-route";
import { removeCoupon } from "@/services/woocommerce/cart";

export async function DELETE(request: NextRequest, { params }: RouteContext<"/api/cart/coupons/[code]">) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const code = decodeURIComponent((await params).code).trim();
  if (!code || code.length > 50) return apiError(400, "invalid_request", "Invalid coupon.");
  try {
    return apiOk({ cart: await removeCoupon(code) });
  } catch (err) {
    return handleApiError("coupon remove", err);
  }
}
