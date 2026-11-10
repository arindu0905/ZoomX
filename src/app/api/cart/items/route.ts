import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { addCartItem } from "@/services/woocommerce/cart";

const addItemSchema = z.object({
  id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(999),
  variation: z
    .array(z.object({ attribute: z.string().min(1).max(100), value: z.string().max(200) }))
    .max(20)
    .optional(),
});

/**
 * Adds a product or variation. Only the product id, quantity and attributes
 * are forwarded — price and stock are decided by WooCommerce.
 */
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const body = await readJson(request, addItemSchema);
  if ("response" in body) return body.response;
  try {
    return apiOk({ cart: await addCartItem(body.data) }, 201);
  } catch (err) {
    return handleApiError("cart add", err);
  }
}
