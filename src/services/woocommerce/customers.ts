import "server-only";
import { z } from "zod";
import { safeEqual } from "@/lib/security";
import { orderSchema, type Order } from "@/types/order";
import { getOrder } from "./orders";
import { restRequest } from "./rest";

/**
 * Customer data via REST v3 (server-only). Every read is scoped to the
 * customer id from the signed session — never to an id from the browser.
 */

const address = z.object({
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  address_1: z.string().default(""),
  address_2: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  postcode: z.string().default(""),
  country: z.string().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional(),
});

export const customerSchema = z.object({
  id: z.number(),
  email: z.string(),
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  billing: address,
  shipping: address,
});
export type Customer = z.infer<typeof customerSchema>;

export const getCustomer = (id: number) => restRequest("GET", `customers/${id}`, customerSchema);

export const updateCustomer = (id: number, patch: Record<string, unknown>) =>
  restRequest("PUT", `customers/${id}`, customerSchema, { body: patch });

/** The customer's most recent orders (newest first). */
export const listCustomerOrders = (customerId: number, perPage = 20): Promise<Order[]> =>
  restRequest("GET", "orders", z.array(orderSchema), {
    query: { customer: customerId, per_page: perPage, orderby: "date", order: "desc" },
  });

/** An order only if it belongs to this customer; null otherwise (no existence leak). */
export async function getCustomerOrder(orderId: number, customerId: number): Promise<Order | null> {
  if (!Number.isInteger(orderId) || orderId <= 0) return null;
  const order = await getOrder(orderId);
  return order && order.customer_id === customerId ? order : null;
}

/**
 * Guest order lookup: order number + the billing email on the order.
 * Returns null on any mismatch so callers can answer generically.
 */
export async function findOrderByNumberAndEmail(orderNumber: string, email: string): Promise<Order | null> {
  const id = Number(orderNumber.replace(/^#/, ""));
  if (!Number.isInteger(id) || id <= 0) return null;
  const order = await getOrder(id);
  if (!order || order.status === "checkout-draft") return null;
  const onOrder = (order.billing.email ?? "").trim().toLowerCase();
  return onOrder && safeEqual(onOrder, email.trim().toLowerCase()) ? order : null;
}
