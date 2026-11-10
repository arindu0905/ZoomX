import { z } from "zod";

/**
 * Subset of the WooCommerce Store API v1 response shapes we rely on.
 * Schemas are lenient (unknown keys pass through) so additive WooCommerce
 * changes don't break the storefront, but anything we render is validated.
 * Reference: https://developer.woocommerce.com/docs/apis/store-api/
 */

export const storeImageSchema = z.object({
  id: z.number(),
  src: z.url(),
  thumbnail: z.url().optional(),
  srcset: z.string().optional(),
  sizes: z.string().optional(),
  name: z.string().optional(),
  alt: z.string().default(""),
});

export const storePricesSchema = z.object({
  price: z.string(),
  regular_price: z.string(),
  sale_price: z.string(),
  currency_code: z.string(),
  currency_minor_unit: z.number().int().min(0),
  price_range: z.object({ min_amount: z.string(), max_amount: z.string() }).nullable().optional(),
});

export const storeProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  short_description: z.string().default(""),
  on_sale: z.boolean(),
  prices: storePricesSchema,
  images: z.array(storeImageSchema).default([]),
  categories: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })).default([]),
  is_in_stock: z.boolean(),
  is_purchasable: z.boolean(),
  has_options: z.boolean().default(false),
  average_rating: z.string().default("0"),
  review_count: z.number().default(0),
});

export const storeCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().default(""),
  parent: z.number(),
  count: z.number(),
  image: storeImageSchema.nullable().optional(),
});

export type StoreImage = z.infer<typeof storeImageSchema>;
export type StorePrices = z.infer<typeof storePricesSchema>;
export type StoreProduct = z.infer<typeof storeProductSchema>;
export type StoreCategory = z.infer<typeof storeCategorySchema>;
