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
  // Ids depend on seed order, so map SKU → REST path (variations included:
  // the products endpoint does not return variations by SKU).
  const paths = new Map<string, string>();
  try {
    const get = async (p: string) =>
      (await (await fetch(`${SANDBOX}/wp-json/wc/v3/${p}`, { headers: { Authorization: auth } })).json()) as {
        id: number;
        sku: string;
        type?: string;
      }[];
    for (const product of await get("products?per_page=100")) {
      paths.set(product.sku, `products/${product.id}`);
      if (product.type === "variable") {
        for (const v of await get(`products/${product.id}/variations?per_page=100`)) {
          paths.set(v.sku, `products/${product.id}/variations/${v.id}`);
        }
      }
    }
  } catch {
    console.warn("[global-setup] restock: sandbox unreachable");
  }
  for (const label of RESTOCK) {
    const path = paths.get(label);
    if (!path) {
      console.warn(`[global-setup] restock ${label}: not found`);
      continue;
    }
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
