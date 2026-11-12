/**
 * Dev only: once `next dev` is up, request the admin screens and main shop
 * pages in the background so they compile before anyone clicks them (first
 * compiles take several seconds each on this machine's WASM compiler).
 * Signed-out requests just redirect to sign-in, but the route still compiles.
 * Set DEV_PREWARM=0 to turn off. Never runs in production.
 */
export function register() {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DEV_PREWARM === "0") return;

  const origin = `http://127.0.0.1:${process.env.PORT ?? 3000}`;
  const routes = [
    "/admin/login",
    "/admin",
    "/admin/orders",
    "/admin/products",
    "/admin/customers",
    "/admin/coupons",
    "/admin/categories",
    "/admin/content",
    "/admin/pages",
    "/admin/orders/new",
    "/admin/products/new",
    "/",
    "/shop",
    "/cart",
    "/checkout",
  ];

  // Not awaited: register() must return before the server starts serving.
  setTimeout(async () => {
    for (const path of routes) {
      try {
        await fetch(origin + path, { redirect: "manual", signal: AbortSignal.timeout(120_000) });
      } catch {
        // server not reachable yet or route failed — it compiles on first visit instead
      }
    }
    console.log(`[dev] pre-compiled ${routes.length} routes`);
  }, 1500);
}
