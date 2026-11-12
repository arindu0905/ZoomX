import "server-only";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { restRequest, restRequestWithMeta } from "@/services/woocommerce/rest";

/**
 * WooCommerce REST v3 calls for the admin dashboard. Server-only; every
 * caller must have passed requireStaff(). WooCommerce stays the source of
 * truth — nothing here computes prices or totals, it only reads and saves.
 */

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
  images: z.array(image).default([]),
  categories: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })).default([]),
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

const address = z
  .object({
    first_name: z.string().default(""),
    last_name: z.string().default(""),
    address_1: z.string().default(""),
    address_2: z.string().default(""),
    city: z.string().default(""),
    state: z.string().default(""),
    postcode: z.string().default(""),
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .partial()
  .default({});

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
  payment_method_title: z.string().default(""),
  billing: address,
  shipping: address,
  line_items: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        quantity: z.number(),
        total: z.string(),
        sku: z.string().nullable().default(""),
      }),
    )
    .default([]),
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
  date_created: z.string(),
  orders_count: z.number().optional(),
  total_spent: z.string().optional(),
  billing: address,
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

export const listProducts = (opts: { page?: number; search?: string; status?: string; stock?: string } = {}) =>
  restRequestWithMeta("GET", "products", z.array(adminProductSchema), {
    query: {
      per_page: PER_PAGE,
      page: opts.page ?? 1,
      orderby: "title",
      order: "asc",
      status: opts.status || "any",
      ...(opts.search ? { search: opts.search } : {}),
      ...(opts.stock ? { stock_status: opts.stock } : {}),
    },
  });

export const getProduct = (id: number) => restRequest("GET", `products/${id}`, adminProductSchema);

export const listVariations = (productId: number) =>
  restRequest("GET", `products/${productId}/variations`, z.array(adminVariationSchema), { query: { per_page: 100 } });

export interface ProductUpdate {
  name?: string;
  status?: "publish" | "draft" | "private";
  featured?: boolean;
  regular_price?: string;
  sale_price?: string;
  manage_stock?: boolean;
  stock_quantity?: number | null;
  stock_status?: "instock" | "outofstock";
  short_description?: string;
  description?: string;
}

export const updateProduct = (id: number, data: ProductUpdate) =>
  restRequest("PUT", `products/${id}`, adminProductSchema, { body: data });

export const updateVariation = (productId: number, id: number, data: ProductUpdate) =>
  restRequest("PUT", `products/${productId}/variations/${id}`, adminVariationSchema, { body: data });

// ── Orders ───────────────────────────────────────────────────────────────

export const listOrders = (opts: { page?: number; status?: string; search?: string; after?: string; perPage?: number } = {}) =>
  restRequestWithMeta("GET", "orders", z.array(adminOrderSchema), {
    query: {
      per_page: opts.perPage ?? PER_PAGE,
      page: opts.page ?? 1,
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.search ? { search: opts.search } : {}),
      ...(opts.after ? { after: opts.after } : {}),
    },
  });

export const getOrder = (id: number) => restRequest("GET", `orders/${id}`, adminOrderSchema);

export const listOrderNotes = (id: number) => restRequest("GET", `orders/${id}/notes`, z.array(orderNoteSchema));

export const updateOrderStatus = (id: number, status: string) =>
  restRequest("PUT", `orders/${id}`, adminOrderSchema, { body: { status } });

export const addOrderNote = (id: number, note: string, toCustomer: boolean) =>
  restRequest("POST", `orders/${id}/notes`, orderNoteSchema, { body: { note, customer_note: toCustomer } });

// ── Customers ────────────────────────────────────────────────────────────

export const listCustomers = (opts: { page?: number; search?: string } = {}) =>
  restRequestWithMeta("GET", "customers", z.array(adminCustomerSchema), {
    query: {
      per_page: PER_PAGE,
      page: opts.page ?? 1,
      orderby: "registered_date",
      order: "desc",
      role: "all",
      ...(opts.search ? { search: opts.search } : {}),
    },
  });

// ── Coupons ──────────────────────────────────────────────────────────────

export const listCoupons = () =>
  restRequest("GET", "coupons", z.array(adminCouponSchema), { query: { per_page: 100 } });

export const createCoupon = (data: {
  code: string;
  discount_type: "percent" | "fixed_cart";
  amount: string;
  description?: string;
  date_expires?: string | null;
  usage_limit?: number | null;
  minimum_amount?: string;
}) => restRequest("POST", "coupons", adminCouponSchema, { body: data });

export const deleteCoupon = (id: number) =>
  restRequest("DELETE", `coupons/${id}`, adminCouponSchema, { query: { force: "true" } });

// ── Dashboard ────────────────────────────────────────────────────────────

/** Orders from the last `days` days (up to 100), for the dashboard summary. */
export const recentOrders = (days: number) =>
  listOrders({ perPage: 100, after: new Date(Date.now() - days * 86_400_000).toISOString() });

export const lowStockProducts = async (threshold = 5) => {
  const { data } = await restRequestWithMeta("GET", "products", z.array(adminProductSchema), {
    query: { per_page: 100, status: "publish" },
  });
  return data
    .filter((p) => p.stock_status === "outofstock" || (p.manage_stock && (p.stock_quantity ?? 0) <= threshold))
    .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0));
};
