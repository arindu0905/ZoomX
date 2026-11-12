import "server-only";
import { after } from "next/server";
import { getRawContent } from "@/services/admin/content";
import {
  dashboardSince,
  listAllProducts,
  listCategories,
  listCoupons,
  listCustomers,
  listOrders,
  listProducts,
  listVariations,
  lowStockProducts,
  recentOrders,
} from "@/services/admin/woo";
import { getContentPages } from "@/services/wordpress/pages";

let running: Promise<void> | null = null;

/**
 * Fills the admin cache for every screen in the sidebar, so each one opens
 * from cache instead of waiting on WooCommerce. Runs at sign-in and after
 * anything that clears the admin cache (saves, checkouts, webhooks). Only
 * one run at a time; extra calls join the run in progress.
 *
 * The arguments must match what each page passes for its default view —
 * the cache is keyed on them (see the pages under app/admin/(dash)).
 */
export function warmAdmin(): Promise<void> {
  running ??= Promise.allSettled([
    warmDashboard(),
    listOrders({ page: 1, status: "", search: "" }),
    listProducts({ page: 1, search: "", stock: "", category: "" }),
    listCategories(),
    listCustomers({ page: 1, search: "" }),
    listCoupons(),
    // Create order: every product, plus the options of products that have them.
    listAllProducts().then((products) =>
      Promise.allSettled(products.filter((p) => p.type === "variable").map((p) => listVariations(p.id))),
    ),
    getRawContent(),
    getContentPages(),
  ])
    .then(() => undefined)
    .finally(() => {
      running = null;
    });
  return running;
}

/**
 * Just the Home screen's data. Started while WordPress checks the password
 * at sign-in, so the dashboard is complete the moment it opens — without
 * the rest of the list slowing the sign-in itself.
 */
export function warmDashboard(): Promise<unknown> {
  return Promise.allSettled([recentOrders(dashboardSince()), lowStockProducts()]);
}

/** Schedules warmAdmin() for after the current response, so it never delays it. */
export function warmAdminSoon(): void {
  after(warmAdmin);
}
