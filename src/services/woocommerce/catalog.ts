import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { toStoreApiParams, type CatalogQuery } from "@/lib/catalog-query";
import {
  storeCategorySchema,
  storeProductDetailSchema,
  storeProductSchema,
  type StoreCategory,
  type StoreProduct,
  type StoreProductDetail,
} from "@/types/store-api";
import { isStoreConfigured, StoreApiError, storeGet, storeGetPage, type Page } from "./store-api";

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
    console.warn(`[catalog] ${label}:`, err instanceof Error ? err.message : "unknown error");
    return [];
  }
}

async function cached_getCategories(): Promise<StoreCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);
  return run(async () => {
    const all = await storeGet("products/categories", z.array(storeCategorySchema));
    // Top-level, non-empty, excluding WooCommerce's default "Uncategorized".
    return all.filter((c) => c.parent === 0 && c.count > 0 && c.slug !== "uncategorized");
  });
}

async function cached_getBestSellers(limit = 8): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);
  return run(() =>
    storeGet("products", z.array(storeProductSchema), {
      orderby: "popularity",
      order: "desc",
      per_page: limit,
    }),
  );
}

async function cached_getFeaturedProducts(limit = 4): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);
  return run(() =>
    storeGet("products", z.array(storeProductSchema), {
      featured: true,
      per_page: limit,
    }),
  );
}

// ── Phase 5: catalogue pages ─────────────────────────────────────────────

export const productTag = (id: number) => `product:${id}`;

const EMPTY_PAGE: Page<StoreProduct> = { items: [], total: 0, totalPages: 0 };

export interface ProductListResult extends Page<StoreProduct> {
  /** False when WooCommerce is unconfigured or unreachable — UI shows an error state, not "no results". */
  ok: boolean;
}

/** One page of products for the shop / category / search pages. */
export async function getProducts(query: CatalogQuery): Promise<ProductListResult> {
  if (!isStoreConfigured()) return { ...EMPTY_PAGE, ok: false };
  try {
    return await cachedProducts(query);
  } catch (err) {
    console.warn("[catalog] products:", err instanceof Error ? err.message : "unknown error");
    return { ...EMPTY_PAGE, ok: false };
  }
}

async function cachedProducts(query: CatalogQuery): Promise<ProductListResult> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.products);
  try {
    const page = await storeGetPage("products", storeProductSchema, toStoreApiParams(query));
    return { ...page, ok: true };
  } catch (err) {
    // WooCommerce answers 400 for an out-of-range page; treat as empty, not as an outage.
    if (err instanceof StoreApiError && err.status === 400) return { ...EMPTY_PAGE, ok: true };
    throw err; // not cached — the next request retries
  }
}

export async function getCategory(slug: string): Promise<StoreCategory | null> {
  if (!isStoreConfigured()) return null;
  try {
    return await cachedCategory(slug);
  } catch (err) {
    console.warn("[catalog] category:", err instanceof Error ? err.message : "unknown error");
    return null;
  }
}

async function cachedCategory(slug: string): Promise<StoreCategory | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.categories);
  const all = await storeGet("products/categories", z.array(storeCategorySchema));
  return all.find((c) => c.slug === slug) ?? null;
}

export interface ProductVariant {
  id: number;
  /** attribute name → selected term (empty string = "any"). */
  attributes: Record<string, string>;
  sku: string;
  prices: StoreProductDetail["prices"];
  onSale: boolean;
  inStock: boolean;
  purchasable: boolean;
  availability: string;
}

export interface ProductDetail {
  product: StoreProductDetail;
  variants: ProductVariant[];
}

/**
 * Product by slug, plus each variation's own price/stock (the parent only
 * carries a price range). Cached briefly; price and stock are re-validated
 * by WooCommerce on add-to-cart and checkout regardless.
 */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.products);
  if (!isStoreConfigured()) return null;
  try {
    const [product] = await storeGet("products", z.array(storeProductDetailSchema), { slug });
    if (!product) return null;
    cacheTag(productTag(product.id));
    const variants = await Promise.all(
      product.variations.map(async (v): Promise<ProductVariant> => {
        const d = await storeGet(`products/${v.id}`, storeProductDetailSchema);
        return {
          id: v.id,
          attributes: Object.fromEntries(v.attributes.map((a) => [a.name, a.value])),
          sku: d.sku,
          prices: d.prices,
          onSale: d.on_sale,
          inStock: d.is_in_stock,
          purchasable: d.is_purchasable,
          availability: d.stock_availability?.text ?? "",
        };
      }),
    );
    return { product, variants };
  } catch (err) {
    if (err instanceof StoreApiError && err.status === 404) return null;
    console.warn("[catalog] product:", err instanceof Error ? err.message : "unknown error");
    throw err; // surfaces the route error boundary rather than a false 404
  }
}

/** Other products from the first shared category. */
async function cached_getRelatedProducts(product: StoreProduct, limit = 4): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);
  const category = product.categories[0]?.slug;
  if (!category) return [];
  return run(async () => {
    const items = await storeGet("products", z.array(storeProductSchema), {
      category,
      per_page: limit + 1,
      orderby: "popularity",
      order: "desc",
    });
    return items.filter((p) => p.id !== product.id).slice(0, limit);
  });
}

/** Slugs to prerender at build time; the rest render on first request. */
export async function getPopularProductSlugs(limit = 24): Promise<string[]> {
  return (await getBestSellers(limit)).map((p) => p.slug);
}

/** Lightweight search for the header suggestions. */
async function cached_searchProducts(term: string, limit = 6): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.products);
  return run(() =>
    storeGet("products", z.array(storeProductSchema), {
      search: term,
      per_page: limit,
    }),
  );
}

/** Every published product's slug + modified date, for the XML sitemap. */
async function cached_getAllProductSlugs(): Promise<{ slug: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);
  return run(async () => {
    const out: { slug: string }[] = [];
    for (let page = 1; page <= 50; page++) {
      const batch = await storeGetPage("products", storeProductSchema, { per_page: 100, page });
      out.push(...batch.items.map((p) => ({ slug: p.slug })));
      if (page >= batch.totalPages) break;
    }
    return out;
  });
}

// ── Uncached wrappers ─────────────────────────────────────────────────────
// Errors thrown inside a "use cache" function are not cached. The cached
// loaders above therefore throw on failure, and these wrappers fall back to
// empty outside the cache — otherwise an outage (e.g. the local sandbox not
// started yet) would be served as "no products" for hours after it recovers.

const run = <T>(fn: () => Promise<T>): Promise<T> => fn();

export const getCategories = (): Promise<StoreCategory[]> => safely("categories", () => cached_getCategories());
export const getBestSellers = (limit = 8): Promise<StoreProduct[]> =>
  safely("best sellers", () => cached_getBestSellers(limit));
export const getFeaturedProducts = (limit = 4): Promise<StoreProduct[]> =>
  safely("featured", () => cached_getFeaturedProducts(limit));
export const getRelatedProducts = (product: StoreProduct, limit = 4): Promise<StoreProduct[]> =>
  safely("related", () => cached_getRelatedProducts(product, limit));
export const searchProducts = (term: string, limit = 6): Promise<StoreProduct[]> =>
  safely("search", () => cached_searchProducts(term, limit));
export const getAllProductSlugs = (): Promise<{ slug: string }[]> =>
  safely("all products", () => cached_getAllProductSlugs());
