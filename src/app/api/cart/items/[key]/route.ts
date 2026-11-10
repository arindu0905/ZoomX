import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { removeCartItem, updateCartItem } from "@/services/woocommerce/cart";

const KEY = /^[a-f0-9]{32}$/;
const updateSchema = z.object({ quantity: z.number().int().min(1).max(999) });

type Ctx = RouteContext<"/api/cart/items/[key]">;

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const { key } = await params;
  if (!KEY.test(key)) return apiError(400, "invalid_request", "Invalid item.");
  const body = await readJson(request, updateSchema);
  if ("response" in body) return body.response;
  try {
    return apiOk({ cart: await updateCartItem(key, body.data.quantity) });
  } catch (err) {
    return handleApiError("cart update", err);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const { key } = await params;
  if (!KEY.test(key)) return apiError(400, "invalid_request", "Invalid item.");
  try {
    return apiOk({ cart: await removeCartItem(key) });
  } catch (err) {
    return handleApiError("cart remove", err);
  }
}
