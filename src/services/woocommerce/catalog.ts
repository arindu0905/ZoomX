import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { storeCategorySchema, storeProductSchema, type StoreCategory, type StoreProduct } from "@/types/store-api";
import { isStoreConfigured, storeGet } from "./store-api";

/** Cache tags revalidated by WooCommerce webhooks (Phase 6). */
export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
} as const;

/**
 * Catalogue reads used by public pages. Until WooCommerce is installed these
 * return empty lists — callers hide their section rather than showing
 * invented products. Errors are logged (without secrets) and degrade to empty
 * so a backend outage never takes down marketing pages.
 */
async function safely<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  if (!isStoreConfigured()) return [];
  try {
    return await fn();
  } catch (err) {
    console.error(`[catalog] ${label}:`, err instanceof Error ? err.message : "unknown error");
    return [];
  }
}

export async function getCategories(): Promise<StoreCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);
  return safely("categories", async () => {
    const all = await storeGet("products/categories", z.array(storeCategorySchema));
    // Top-level, non-empty, excluding WooCommerce's default "Uncategorized".
    return all.filter((c) => c.parent === 0 && c.count > 0 && c.slug !== "uncategorized");
  });
}

export async function getBestSellers(limit = 8): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);
  return safely("best sellers", () =>
    storeGet("products", z.array(storeProductSchema), { orderby: "popularity", order: "desc", per_page: limit }),
  );
}

export async function getFeaturedProducts(limit = 4): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);
  return safely("featured", () =>
    storeGet("products", z.array(storeProductSchema), { featured: true, per_page: limit }),
  );
}
