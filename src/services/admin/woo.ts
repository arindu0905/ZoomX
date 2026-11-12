import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { restRequest, restRequestWithMeta } from "@/services/woocommerce/rest";

/**
 * WooCommerce REST v3 for the admin dashboard: reads (cached briefly) and
 * full create / update / delete. Server-only; every caller must have passed
 * requireStaff(). WooCommerce stays the source of truth — prices, totals
 * and stock are calculated by WooCommerce, never here.
 *
 * Reads are cached for up to a minute under ADMIN_TAG. Every admin save,
 * every storefront checkout and every WooCommerce webhook clears that tag,
 * so staff see changes immediately while page-to-page browsing is fast.
 */
export const ADMIN_TAG = "admin";

function adminCache() {
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag(ADMIN_TAG);
}

const money = z.string().default("");

/**
 * WooCommerce builds media URLs from the request's scheme. Align them with
 * WOOCOMMERCE_STORE_URL so next/image accepts them (and the local sandbox,
 * which treats REST calls as HTTPS but serves media over http, still works).
 */
function alignToStore(src: string): string {
  const base = getServerEnv().WOOCOMMERCE_STORE_URL;
  if (!base) return src;
  try {
    const url = new URL(src);
    const store = new URL(base);
    if (url.hostname === store.hostname) {
      url.protocol = store.protocol;
      url.port = store.port;
    }
    return url.toString();
  } catch {
    return src;
  }
}

const image = z.object({ id: z.number(), src: z.string().transform(alignToStore), alt: z.string().default("") });
const attribute = z.object({
  id: z.number().default(0),
  name: z.string(),
  options: z.array(z.string()).default([]),
  visible: z.boolean().default(true),
  variation: z.boolean().default(false),
});

export const adminProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  status: z.string(),
  featured: z.boolean(),
  sku: z.string().default(""),
  price: money,
  regular_price: money,
  sale_price: money,
  on_sale: z.boolean().default(false),
  manage_stock: z.boolean(),
  stock_quantity: z.number().nullable(),
  stock_status: z.string(),
  short_description: z.string().default(""),
  description: z.string().default(""),
  weight: z.string().default(""),
  images: z.array(image).default([]),
  categories: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })).default([]),
  attributes: z.array(attribute).default([]),
  variations: z.array(z.number()).default([]),
  total_sales: z.coerce.number().default(0),
});
export type AdminProduct = z.infer<typeof adminProductSchema>;

export const adminVariationSchema = z.object({
  id: z.number(),
  sku: z.string().default(""),
  price: money,
  regular_price: money,
  sale_price: money,
  manage_stock: z.union([z.boolean(), z.literal("parent")]),
  stock_quantity: z.number().nullable(),
  stock_status: z.string(),
  attributes: z.array(z.object({ name: z.string(), option: z.string() })).default([]),
});
export type AdminVariation = z.infer<typeof adminVariationSchema>;

export const adminCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  parent: z.number().default(0),
  description: z.string().default(""),
  count: z.number().default(0),
  image: image.nullable().default(null),
});
export type AdminCategory = z.infer<typeof adminCategorySchema>;

const address = z
  .object({
    first_name: z.string().default(""),
    last_name: z.string().default(""),
    company: z.string().default(""),
    address_1: z.string().default(""),
    address_2: z.string().default(""),
    city: z.string().default(""),
    state: z.string().default(""),
    postcode: z.string().default(""),
    country: z.string().default(""),
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .partial()
  .default({});
export type AdminAddress = z.infer<typeof address>;

export const adminOrderSchema = z.object({
  id: z.number(),
  number: z.string(),
  status: z.string(),
  currency: z.string(),
  total: z.string(),
  shipping_total: z.string().default("0"),
  discount_total: z.string().default("0"),
  date_created: z.string(),
  customer_id: z.number().default(0),
  customer_note: z.string().default(""),
  payment_method: z.string().default(""),
  payment_method_title: z.string().default(""),
  created_via: z.string().default(""),
  billing: address,
  shipping: address,
  line_items: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        product_id: z.number().default(0),
        variation_id: z.number().default(0),
        quantity: z.number(),
        total: z.string(),
        sku: z.string().nullable().default(""),
      }),
    )
    .default([]),
  shipping_lines: z.array(z.object({ id: z.number(), method_title: z.string(), total: z.string() })).default([]),
});
export type AdminOrder = z.infer<typeof adminOrderSchema>;

export const orderNoteSchema = z.object({
  id: z.number(),
  note: z.string(),
  customer_note: z.boolean(),
  author: z.string().default(""),
  date_created: z.string(),
});

export const adminCustomerSchema = z.object({
  id: z.number(),
  email: z.string(),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  username: z.string().default(""),
  date_created: z.string(),
  billing: address,
  shipping: address,
});
export type AdminCustomer = z.infer<typeof adminCustomerSchema>;

export const adminCouponSchema = z.object({
  id: z.number(),
  code: z.string(),
  amount: z.string(),
  discount_type: z.string(),
  description: z.string().default(""),
  date_expires: z.string().nullable(),
  usage_count: z.number().default(0),
  usage_limit: z.number().nullable(),
  minimum_amount: z.string().default(""),
  free_shipping: z.boolean().default(false),
});
export type AdminCoupon = z.infer<typeof adminCouponSchema>;

/** WooCommerce order statuses the team works with, in workflow order. */
export const ORDER_STATUSES = [
  { value: "pending", label: "Pending payment" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
] as const;
export const ORDER_STATUS_VALUES = ORDER_STATUSES.map((s) => s.value) as [string, ...string[]];

const PER_PAGE = 20;

// ── Products ─────────────────────────────────────────────────────────────

export async function listProducts(opts: { page?: number; search?: string; status?: string; stock?: string; category?: string } = {}) {
  "use cache";
  adminCache();
  return restRequestWithMeta("GET", "products", z.array(adminProductSchema), {
    query: {
      per_page: PER_PAGE,
      page: opts.page ?? 1,
      orderby: "title",
      order: "asc",
      status: opts.status || "any",
      ...(opts.search ? { search: opts.search } : {}),
      ...(opts.stock ? { stock_status: opts.stock } : {}),
      ...(opts.category ? { category: opts.category } : {}),
    },
  });
}

export async function getProduct(id: number) {
  "use cache";
  adminCache();
  return restRequest("GET", `products/${id}`, adminProductSchema);
}

export async function listVariations(productId: number) {
  "use cache";
  adminCache();
  return restRequest("GET", `products/${productId}/variations`, z.array(adminVariationSchema), { query: { per_page: 100 } });
}

/** Every product, for pickers (manual orders). */
export async function listAllProducts() {
  "use cache";
  adminCache();
  return restRequest("GET", "products", z.array(adminProductSchema), { query: { per_page: 100, status: "publish", orderby: "title", order: "asc" } });
}

export interface ProductInput {
  name?: string;
  type?: "simple" | "variable";
  status?: "publish" | "draft" | "private";
  featured?: boolean;
  sku?: string;
  regular_price?: string;
  sale_price?: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: "instock" | "outofstock";
  short_description?: string;
  description?: string;
  weight?: string;
  categories?: { id: number }[];
  images?: { id: number }[];
  attributes?: { id?: number; name: string; options: string[]; visible: boolean; variation: boolean }[];
}

export const createProduct = (data: ProductInput) => restRequest("POST", "products", adminProductSchema, { body: data });

export const updateProduct = (id: number, data: ProductInput) =>
  restRequest("PUT", `products/${id}`, adminProductSchema, { body: data });

/** Moves a product to the WordPress trash (restorable there for 30 days). */
export const trashProduct = (id: number) => restRequest("DELETE", `products/${id}`, adminProductSchema);

export const updateVariation = (productId: number, id: number, data: ProductInput) =>
  restRequest("PUT", `products/${productId}/variations/${id}`, adminVariationSchema, { body: data });

export const createVariation = (
  productId: number,
  data: { attributes: { name: string; option: string }[]; regular_price: string; sale_price?: string; manage_stock: true; stock_quantity: number; sku?: string },
) => restRequest("POST", `products/${productId}/variations`, adminVariationSchema, { body: data });

export const deleteVariation = (productId: number, id: number) =>
  restRequest("DELETE", `products/${productId}/variations/${id}`, adminVariationSchema, { query: { force: "true" } });

// ── Categories ───────────────────────────────────────────────────────────

export async function listCategories() {
  "use cache";
  adminCache();
  return restRequest("GET", "products/categories", z.array(adminCategorySchema), { query: { per_page: 100, orderby: "name" } });
}

export const createCategory = (data: { name: string; description?: string; image?: { id: number } }) =>
  restRequest("POST", "products/categories", adminCategorySchema, { body: data });

export const updateCategory = (id: number, data: { name?: string; description?: string; image?: { id: number } }) =>
  restRequest("PUT", `products/categories/${id}`, adminCategorySchema, { body: data });

export const deleteCategory = (id: number) =>
  restRequest("DELETE", `products/categories/${id}`, adminCategorySchema, { query: { force: "true" } });

// ── Orders ───────────────────────────────────────────────────────────────

export async function listOrders(opts: { page?: number; status?: string; search?: string; after?: string; perPage?: number } = {}) {
  "use cache";
  adminCache();
  return restRequestWithMeta("GET", "orders", z.array(adminOrderSchema), {
    query: {
      per_page: opts.perPage ?? PER_PAGE,
      page: opts.page ?? 1,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.search ? { search: opts.search } : {}),
      ...(opts.after ? { after: opts.after } : {}),
    },
  });
}

export async function getOrder(id: number) {
  "use cache";
  adminCache();
  return restRequest("GET", `orders/${id}`, adminOrderSchema);
}

export async function listOrderNotes(id: number) {
  "use cache";
  adminCache();
  return restRequest("GET", `orders/${id}/notes`, z.array(orderNoteSchema));
}

export interface OrderInput {
  status?: string;
  customer_id?: number;
  customer_note?: string;
  billing?: AdminAddress;
  shipping?: AdminAddress;
  payment_method?: string;
  payment_method_title?: string;
  set_paid?: boolean;
  line_items?: { product_id: number; variation_id?: number; quantity: number }[];
  shipping_lines?: { method_id: string; method_title: string; total: string }[];
}

/** WooCommerce prices the items and calculates totals; nothing is computed here. */
export const createOrder = (data: OrderInput) => restRequest("POST", "orders", adminOrderSchema, { body: data });

export const updateOrder = (id: number, data: OrderInput) => restRequest("PUT", `orders/${id}`, adminOrderSchema, { body: data });

/** Moves an order to the trash (restorable in WooCommerce for 30 days). */
export const trashOrder = (id: number) => restRequest("DELETE", `orders/${id}`, adminOrderSchema);

export const addOrderNote = (id: number, note: string, toCustomer: boolean) =>
  restRequest("POST", `orders/${id}/notes`, orderNoteSchema, { body: { note, customer_note: toCustomer } });

export const deleteOrderNote = (orderId: number, noteId: number) =>
  restRequest("DELETE", `orders/${orderId}/notes/${noteId}`, orderNoteSchema, { query: { force: "true" } });

// ── Customers ────────────────────────────────────────────────────────────

export async function listCustomers(opts: { page?: number; search?: string } = {}) {
  "use cache";
  adminCache();
  return restRequestWithMeta("GET", "customers", z.array(adminCustomerSchema), {
    query: {
      per_page: PER_PAGE,
      page: opts.page ?? 1,
      orderby: "registered_date",
      order: "desc",
      role: "customer",
      ...(opts.search ? { search: opts.search } : {}),
    },
  });
}

export async function getCustomer(id: number) {
  "use cache";
  adminCache();
  return restRequest("GET", `customers/${id}`, adminCustomerSchema);
}

export interface CustomerInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  billing?: AdminAddress;
  shipping?: AdminAddress;
}

/** WooCommerce emails the new customer a link to set their own password. */
export const createCustomer = (data: CustomerInput) => restRequest("POST", "customers", adminCustomerSchema, { body: data });

export const updateCustomer = (id: number, data: CustomerInput) =>
  restRequest("PUT", `customers/${id}`, adminCustomerSchema, { body: data });

/** Deletes the account. Their past orders stay in Orders (as guest orders). */
export const deleteCustomer = (id: number) =>
  restRequest("DELETE", `customers/${id}`, adminCustomerSchema, { query: { force: "true" } });

// ── Coupons ──────────────────────────────────────────────────────────────

export async function listCoupons() {
  "use cache";
  adminCache();
  return restRequest("GET", "coupons", z.array(adminCouponSchema), { query: { per_page: 100 } });
}

export async function getCoupon(id: number) {
  "use cache";
  adminCache();
  return restRequest("GET", `coupons/${id}`, adminCouponSchema);
}

export interface CouponInput {
  code?: string;
  discount_type?: "percent" | "fixed_cart";
  amount?: string;
  description?: string;
  date_expires?: string | null;
  usage_limit?: number | null;
  minimum_amount?: string;
  free_shipping?: boolean;
}

export const createCoupon = (data: CouponInput) => restRequest("POST", "coupons", adminCouponSchema, { body: data });

export const updateCoupon = (id: number, data: CouponInput) =>
  restRequest("PUT", `coupons/${id}`, adminCouponSchema, { body: data });

export const deleteCoupon = (id: number) =>
  restRequest("DELETE", `coupons/${id}`, adminCouponSchema, { query: { force: "true" } });

// ── Dashboard ────────────────────────────────────────────────────────────

/** Orders since the given day (ISO date, so the cache key is stable for the day). */
export const recentOrders = (sinceDay: string) => listOrders({ perPage: 100, after: `${sinceDay}T00:00:00` });

export async function lowStockProducts(threshold = 5) {
  "use cache";
  adminCache();
  const data = await restRequest("GET", "products", z.array(adminProductSchema), { query: { per_page: 100, status: "publish" } });
  return data
    .filter((p) => p.stock_status === "outofstock" || (p.manage_stock && (p.stock_quantity ?? 0) <= threshold))
    .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0));
}
