import { connection } from "next/server";
import { apiOk, handleApiError } from "@/lib/api-route";
import { getCart } from "@/services/woocommerce/cart";

/** The current customer's cart, straight from WooCommerce. */
export async function GET() {
  // Customer-specific: render per request (outside the try so Next's
  // prerender signal isn't swallowed by our error handling).
  await connection();
  try {
    return apiOk({ cart: await getCart() });
  } catch (err) {
    return handleApiError("cart", err);
  }
}
