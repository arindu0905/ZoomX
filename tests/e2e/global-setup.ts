/**
 * Restocks the sandbox products that order-placing specs consume, so repeated
 * runs don't drain stock. Runs ONLY against the local WooCommerce sandbox
 * (http://127.0.0.1:9400) — never against a real store.
 */
const SANDBOX = "http://127.0.0.1:9400";
/** Placeholder SKUs from sandbox/seed.php used by order-placing specs. */
const RESTOCK = ["SBX-DISH-550", "SBX-AIR-CIN-550"];

export default async function globalSetup() {
  const { WOOCOMMERCE_STORE_URL: store, WOOCOMMERCE_CONSUMER_KEY: ck, WOOCOMMERCE_CONSUMER_SECRET: cs } = process.env;
  if (store?.replace(/\/$/, "") !== SANDBOX || !ck || !cs) return;
  const auth = `Basic ${Buffer.from(`${ck}:${cs}`).toString("base64")}`;
  for (const label of RESTOCK) {
    try {
      // Ids depend on seed order, so find each item by SKU first.
      const lookup = await fetch(`${SANDBOX}/wp-json/wc/v3/products?sku=${label}`, { headers: { Authorization: auth } });
      const [item] = (await lookup.json()) as { id: number; parent_id: number }[];
      if (!item) {
        console.warn(`[global-setup] restock ${label}: not found`);
        continue;
      }
      const path = item.parent_id ? `products/${item.parent_id}/variations/${item.id}` : `products/${item.id}`;
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
