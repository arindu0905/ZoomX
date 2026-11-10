/**
 * Restocks the sandbox products that order-placing specs consume, so repeated
 * runs don't drain stock. Runs ONLY against the local WooCommerce sandbox
 * (http://127.0.0.1:9400) — never against a real store.
 */
const SANDBOX = "http://127.0.0.1:9400";
const RESTOCK = [
  { path: "products/10", label: "Sandbox Dish Liquid" },
  { path: "products/15/variations/17", label: "Sandbox Laundry Liquid 1 L" },
  { path: "products/15/variations/16", label: "Sandbox Laundry Liquid 500 ml" },
];

export default async function globalSetup() {
  const { WOOCOMMERCE_STORE_URL: store, WOOCOMMERCE_CONSUMER_KEY: ck, WOOCOMMERCE_CONSUMER_SECRET: cs } = process.env;
  if (store?.replace(/\/$/, "") !== SANDBOX || !ck || !cs) return;
  const auth = `Basic ${Buffer.from(`${ck}:${cs}`).toString("base64")}`;
  for (const { path, label } of RESTOCK) {
    try {
      const res = await fetch(`${SANDBOX}/wp-json/wc/v3/${path}`, {
        method: "PUT",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ manage_stock: true, stock_quantity: 500 }),
      });
      if (!res.ok) console.warn(`[global-setup] restock ${label}: HTTP ${res.status}`);
    } catch {
      console.warn(`[global-setup] restock ${label}: sandbox unreachable`);
    }
  }

  // The sandbox can't deliver webhooks to the app, so refresh the cached
  // catalogue the same way an operator would.
  const base = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  if (process.env.REVALIDATE_SECRET) {
    try {
      const res = await fetch(`${base}/api/revalidate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.REVALIDATE_SECRET}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["products"] }),
      });
      if (!res.ok) console.warn(`[global-setup] revalidate: HTTP ${res.status}`);
    } catch {
      console.warn("[global-setup] revalidate: app unreachable");
    }
  }
}
