import { createHmac } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { hasSandboxCatalogue, sandboxIds } from "./store";

/**
 * Cart session + webhook behaviour against the WooCommerce sandbox.
 * API-level (no UI yet — the bag UI lands in Phase 7). Desktop project only:
 * the device profile doesn't matter for HTTP calls.
 */
test.beforeEach(async ({ request }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "API spec runs once");
  test.skip(!(await hasSandboxCatalogue(request)), "needs the WooCommerce sandbox");
});


function json(request: APIRequestContext, baseURL: string) {
  const headers = { Origin: baseURL, "Content-Type": "application/json" };
  return {
    get: () => request.get("/api/cart"),
    add: (id: number, quantity: number) => request.post("/api/cart/items", { headers, data: { id, quantity } }),
    update: (key: string, quantity: number) => request.patch(`/api/cart/items/${key}`, { headers, data: { quantity } }),
    remove: (key: string) => request.delete(`/api/cart/items/${key}`, { headers: { Origin: baseURL } }),
  };
}

test("cart persists across requests and WooCommerce calculates totals", async ({ request, baseURL }) => {
  const { cinnamon, dish } = await sandboxIds(request);
  const api = json(request, baseURL!);
  expect((await (await api.get()).json()).cart.items_count).toBe(0);

  const added = await api.add(cinnamon, 2);
  expect(added.status()).toBe(201);
  expect(added.headers()["set-cookie"]).toMatch(/zx_cart=.*HttpOnly/i);
  expect(added.headers()["cache-control"]).toBe("private, no-store");

  await api.add(dish, 1);
  const { cart } = await (await api.get()).json(); // new request, same cookie jar
  expect(cart.items.map((i: { name: string; quantity: number }) => [i.name, i.quantity])).toEqual([
    ["Air Freshener", 2],
    ["Dish Washing Liquid", 1],
  ]);
  expect(cart.items[0].variation[0]).toMatchObject({ attribute: "Fragrance", value: "Cinnamon" });
  // 2 × 750 + 650 + 350 sandbox flat-rate shipping, in minor units
  expect(cart.totals.total_price).toBe("250000");

  const key = cart.items[0].key;
  expect((await (await api.update(key, 3)).json()).cart.items_count).toBe(4);
  expect((await (await api.remove(key)).json()).cart.items_count).toBe(1);
});

test("out-of-stock variations are refused by WooCommerce", async ({ request, baseURL }) => {
  const { greenApple } = await sandboxIds(request);
  const res = await json(request, baseURL!).add(greenApple, 1);
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toMatchObject({ code: "woocommerce_rest_product_out_of_stock" });
});

test("mutations reject cross-site requests and invalid input", async ({ request }) => {
  const cross = await request.post("/api/cart/items", {
    headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
    data: { id: 1, quantity: 1 }, // rejected on origin before the id matters
  });
  expect(cross.status()).toBe(403);

  const invalid = await request.post("/api/cart/items", {
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    data: { id: -1, quantity: 0 },
  });
  expect([400, 403]).toContain(invalid.status());
});

test("a forged session cookie is ignored", async ({ request }) => {
  const res = await request.get("/api/cart", { headers: { Cookie: "zx_cart=forged.value" } });
  expect((await res.json()).cart.items_count).toBe(0);
});

test.describe("webhooks", () => {
  const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

  test("rejects unsigned and wrongly signed deliveries", async ({ request }) => {
    test.skip(!secret, "WOOCOMMERCE_WEBHOOK_SECRET not set");
    const res = await request.post("/api/webhooks/woocommerce", {
      headers: { "X-WC-Webhook-Topic": "product.updated", "X-WC-Webhook-Signature": "AAAA" },
      data: '{"id":10}',
    });
    expect(res.status()).toBe(401);
  });

  test("a signed product webhook revalidates and the page re-renders", async ({ request }) => {
    test.skip(!secret, "WOOCOMMERCE_WEBHOOK_SECRET not set");
    const { dish } = await sandboxIds(request);
    const body = JSON.stringify({ id: dish });
    const signature = createHmac("sha256", secret!).update(body).digest("base64");
    const res = await request.post("/api/webhooks/woocommerce", {
      headers: { "X-WC-Webhook-Topic": "product.updated", "X-WC-Webhook-Signature": signature },
      data: body,
    });
    expect(await res.json()).toMatchObject({
      ok: true,
      revalidated: expect.arrayContaining(["products", `product:${dish}`]),
    });
    // Regression: on-demand re-render after revalidation must not 500.
    const page = await request.get("/product/dish-washing-liquid");
    expect(page.status()).toBe(200);
    expect(await page.text()).toContain("Dish Washing Liquid");
  });
});
