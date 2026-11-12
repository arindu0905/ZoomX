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
 *
 * Calls go out WARM_CONCURRENCY at a time, most-used screens first. Firing
 * them all at once queues ~15 requests in WordPress (the local Playground
 * sandbox answers one at a time), so the first real click after sign-in
 * waited ~10 s behind the warm-up. Trickled, a click waits behind at most
 * one or two calls.
 */
const WARM_CONCURRENCY = 2;

export function warmAdmin(): Promise<void> {
  const tasks: (() => Promise<unknown>)[] = [
    warmDashboard,
    () => listOrders({ page: 1, status: "", search: "" }),
    () => listProducts({ page: 1, search: "", stock: "", category: "" }),
    () => listCustomers({ page: 1, search: "" }),
    listCategories,
    listCoupons,
    getRawContent,
    getContentPages,
    // Create order: every product, then the options of products that have them (one call each, so last).
    async () => {
      const products = await listAllProducts();
      for (const p of products.filter((x) => x.type === "variable")) await listVariations(p.id).catch(() => undefined);
    },
  ];
  running ??= runLimited(tasks, WARM_CONCURRENCY)
    .then(() => undefined)
    .finally(() => {
      running = null;
    });
  return running;
}

/** Runs tasks in order with at most `limit` in flight; failures are ignored (pages fetch again on demand). */
async function runLimited(tasks: (() => Promise<unknown>)[], limit: number): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      await task().catch(() => undefined);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
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
