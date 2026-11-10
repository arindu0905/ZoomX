import type { APIRequestContext } from "@playwright/test";

/**
 * True when the app under test is connected to a WooCommerce store with the
 * local sandbox catalogue (`npm run sandbox`). Catalogue specs skip without it;
 * "no store" specs skip with it.
 */
export async function hasSandboxCatalogue(request: APIRequestContext): Promise<boolean> {
  const res = await request.get("/api/search?q=sandbox");
  if (!res.ok()) return false;
  const body = (await res.json()) as { results: unknown[] };
  return body.results.length > 0;
}
