import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { selectShippingRate } from "@/services/woocommerce/cart";

const schema = z.object({
  packageId: z.union([z.number().int().min(0), z.string().max(50)]),
  rateId: z.string().min(1).max(100),
});

/** Chooses one of the rates WooCommerce offered; WooCommerce prices it. */
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const body = await readJson(request, schema);
  if ("response" in body) return body.response;
  try {
    return apiOk({ cart: await selectShippingRate(body.data.packageId, body.data.rateId) });
  } catch (err) {
    return handleApiError("shipping select", err);
  }
}
