import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

export class StoreApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    /** WooCommerce's own human-readable reason, when it gave one (admin only; never shown to shoppers). */
    public readonly detail?: string,
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

const RETRYABLE = new Set([502, 503, 504]);
const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<S extends z.ZodType>(path: string, schema: S, query?: Query) {
  const url = buildUrl(path, query);
  const { WOOCOMMERCE_REQUEST_TIMEOUT_MS } = getServerEnv();
  let res: Response | undefined;
  let body: unknown;
  // Read-only GETs are safe to retry: brief upstream blips (502/503/504, a
  // dropped connection, or a PHP notice corrupting the JSON) shouldn't fail a
  // page render or a build.
  for (let attempt = 1; ; attempt++) {
    const last = attempt >= MAX_ATTEMPTS;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(WOOCOMMERCE_REQUEST_TIMEOUT_MS),
      });
      if (!RETRYABLE.has(res.status) || last) {
        if (!res.ok) throw new StoreApiError(`Store API ${res.status} for ${url.pathname}`, res.status);
        const text = await res.text();
        try {
          body = JSON.parse(text);
          break;
        } catch {
          if (last) throw new StoreApiError(`Store API returned invalid JSON for ${url.pathname}`, 502);
        }
      }
    } catch (err) {
      if (err instanceof StoreApiError) throw err;
      if (last) {
        const reason = err instanceof Error && err.name === "TimeoutError" ? "timed out" : "failed";
        throw new StoreApiError(`Store API request ${reason}: ${url.pathname}`);
      }
    }
    await sleep(250 * 2 ** (attempt - 1));
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new StoreApiError(`Unexpected Store API response shape for ${url.pathname}`);
  }
  return { data: parsed.data as z.infer<S>, headers: res.headers };
}

/**
 * Public, unauthenticated, read-only Store API GET (catalogue data).
 * Cart and checkout calls carry a customer Cart-Token and live in a
 * separate session-aware client (Phase 6/7) — never through this function.
 */
export async function storeGet<S extends z.ZodType>(path: string, schema: S, query?: Query): Promise<z.infer<S>> {
  return (await request(path, schema, query)).data;
}

export interface Page<T> {
  items: T[];
  total: number;
  totalPages: number;
}

/** Collection GET that also reads WordPress pagination headers. */
export async function storeGetPage<S extends z.ZodType>(
  path: string,
  schema: S,
  query?: Query,
): Promise<Page<z.infer<S>>> {
  const { data, headers } = await request(path, z.array(schema), query);
  const int = (h: string) => Math.max(0, Number.parseInt(headers.get(h) ?? "", 10) || 0);
  return {
    items: data,
    total: int("x-wp-total") || data.length,
    totalPages: int("x-wp-totalpages") || 1,
  };
}
