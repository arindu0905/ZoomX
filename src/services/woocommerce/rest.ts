import "server-only";
import type { z } from "zod";
import { getServerEnv, requireEnv } from "@/lib/env";
import { StoreApiError } from "./store-api";

/**
 * WooCommerce REST API v3 — authenticated, server-only. Used for data the
 * public Store API doesn't expose (order lookup, customer accounts). The
 * consumer key/secret never leave the server. Never cached.
 */
export async function restRequest<S extends z.ZodType>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  schema: S,
  options: { query?: Record<string, string | number>; body?: unknown } = {},
): Promise<z.infer<S>> {
  return (await restRequestWithMeta(method, path, schema, options)).data;
}

export interface RestPage<T> {
  data: T;
  total: number;
  totalPages: number;
}

/** Same as restRequest, plus WooCommerce's X-WP-Total / X-WP-TotalPages for list endpoints. */
export async function restRequestWithMeta<S extends z.ZodType>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  schema: S,
  options: { query?: Record<string, string | number>; body?: unknown } = {},
): Promise<RestPage<z.infer<S>>> {
  const { WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET } = requireEnv(
    "WOOCOMMERCE_STORE_URL",
    "WOOCOMMERCE_CONSUMER_KEY",
    "WOOCOMMERCE_CONSUMER_SECRET",
  );
  const url = new URL(`/wp-json/wc/v3/${path.replace(/^\//, "")}`, WOOCOMMERCE_STORE_URL);
  for (const [k, v] of Object.entries(options.query ?? {})) url.searchParams.set(k, String(v));

  // WooCommerce accepts Basic auth only over HTTPS (production must be HTTPS).
  const auth = Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString("base64");
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(getServerEnv().WOOCOMMERCE_REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? "timed out" : "failed";
    throw new StoreApiError(`REST request ${reason}: ${url.pathname}`, 504);
  }
  if (!res.ok) throw new StoreApiError(`REST ${res.status} for ${url.pathname}`, res.status);
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new StoreApiError(`Unexpected REST response shape for ${url.pathname}`, 502);
  return {
    data: parsed.data,
    total: Number(res.headers.get("x-wp-total") ?? 0),
    totalPages: Number(res.headers.get("x-wp-totalpages") ?? 0),
  };
}
