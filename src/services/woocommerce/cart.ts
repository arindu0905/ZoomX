import "server-only";
import { getServerEnv } from "@/lib/env";
import { cartSchema, storeErrorSchema, type Cart } from "@/types/cart";
import { decodeEntities } from "@/utils/text";
import { readCartToken, writeCartToken } from "./session";
import { StoreApiError } from "./store-api";

/**
 * Session-aware Store API cart client. Runs only on the server (Route
 * Handlers), forwarding the customer's Cart-Token and persisting the token
 * WooCommerce returns. Never cached: carts are customer-specific.
 *
 * Nonces: WooCommerce skips its nonce check for requests that carry a valid
 * Cart-Token (verified against the sandbox), so no nonce is stored or sent.
 * CSRF protection for our own endpoints is done in the route handlers.
 */

export class CartApiError extends StoreApiError {
  constructor(
    message: string,
    status: number,
    public readonly code: string,
  ) {
    super(message, status);
    this.name = "CartApiError";
  }
}

type Method = "GET" | "POST";

async function cartRequest(method: Method, path: string, body?: unknown): Promise<Cart> {
  let token = await readCartToken();
  // Without a Cart-Token WooCommerce demands a nonce for writes. Start a
  // session first (a GET issues a token), then make the write with it.
  if (!token && method === "POST") token = (await send("GET", "cart", null)).token;
  return (await send(method, path, token, body)).cart;
}

async function send(
  method: Method,
  path: string,
  token: string | null,
  body?: unknown,
): Promise<{ cart: Cart; token: string | null }> {
  const { WOOCOMMERCE_STORE_URL, WOOCOMMERCE_REQUEST_TIMEOUT_MS } = getServerEnv();
  if (!WOOCOMMERCE_STORE_URL) throw new StoreApiError("WooCommerce store URL is not configured", 503);

  const url = new URL(`/wp-json/wc/store/v1/${path}`, WOOCOMMERCE_STORE_URL);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Cart-Token"] = token;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(WOOCOMMERCE_REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? "timed out" : "failed";
    throw new StoreApiError(`Cart request ${reason}: ${url.pathname}`, 504);
  }

  // WooCommerce issues a new token for a new/expired session — persist it.
  const issued = res.headers.get("cart-token");
  if (issued && issued !== token) await writeCartToken(issued);
  const current = issued ?? token;

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = storeErrorSchema.safeParse(json);
    // WooCommerce cart errors are customer-facing ("out of stock", "invalid coupon").
    const message = err.success ? decodeEntities(err.data.message).slice(0, 300) : "The cart could not be updated.";
    throw new CartApiError(message, res.status, err.success ? err.data.code : "unknown");
  }

  const parsed = cartSchema.safeParse(json);
  if (!parsed.success) throw new StoreApiError(`Unexpected cart response shape for ${url.pathname}`, 502);
  return { cart: parsed.data, token: current };
}

export const getCart = () => cartRequest("GET", "cart");

export interface AddItemInput {
  id: number;
  quantity: number;
  /** For variable products where WooCommerce needs the attribute values. */
  variation?: { attribute: string; value: string }[];
}

export const addCartItem = (input: AddItemInput) => cartRequest("POST", "cart/add-item", input);

export const updateCartItem = (key: string, quantity: number) =>
  cartRequest("POST", "cart/update-item", { key, quantity });

export const removeCartItem = (key: string) => cartRequest("POST", "cart/remove-item", { key });

export const applyCoupon = (code: string) => cartRequest("POST", "cart/apply-coupon", { code });

export const removeCoupon = (code: string) => cartRequest("POST", "cart/remove-coupon", { code });

export const selectShippingRate = (packageId: number | string, rateId: string) =>
  cartRequest("POST", "cart/select-shipping-rate", { package_id: packageId, rate_id: rateId });
