import "server-only";
import type { z } from "zod";
import { getServerEnv } from "@/lib/env";

export class StoreApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

/** True once WOOCOMMERCE_STORE_URL is configured. */
export function isStoreConfigured(): boolean {
  return !!getServerEnv().WOOCOMMERCE_STORE_URL;
}

type Query = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, query: Query = {}): URL {
  const base = getServerEnv().WOOCOMMERCE_STORE_URL;
  if (!base) throw new StoreApiError("WooCommerce store URL is not configured");
  const url = new URL(`/wp-json/wc/store/v1/${path.replace(/^\//, "")}`, base);
  for (const [k, v] of Object.entries(query)) if (v !== undefined) url.searchParams.set(k, String(v));
  return url;
}

/**
 * Public, unauthenticated, read-only Store API GET (catalogue data).
 * Cart and checkout calls carry a customer Cart-Token and live in a
 * separate session-aware client (Phase 6/7) — never through this function.
 */
export async function storeGet<S extends z.ZodType>(path: string, schema: S, query?: Query): Promise<z.infer<S>> {
  const url = buildUrl(path, query);
  const { WOOCOMMERCE_REQUEST_TIMEOUT_MS } = getServerEnv();
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(WOOCOMMERCE_REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? "timed out" : "failed";
    throw new StoreApiError(`Store API request ${reason}: ${url.pathname}`);
  }
  if (!res.ok) throw new StoreApiError(`Store API ${res.status} for ${url.pathname}`, res.status);

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    throw new StoreApiError(`Unexpected Store API response shape for ${url.pathname}`);
  }
  return parsed.data;
}
