import type { APIRequestContext } from "@playwright/test";

/** Local WooCommerce sandbox (`npm run sandbox`, seeded by sandbox/seed.php). */
export const SANDBOX = "http://127.0.0.1:9400";

/**
 * True when the app under test is connected to the local sandbox catalogue:
 * the real ZOOM X range with sandbox-only placeholder SKUs (SBX-…), prices
 * and stock. Catalogue specs skip without it; "no store" specs skip with it.
 */
export async function hasSandboxCatalogue(request: APIRequestContext): Promise<boolean> {
  const res = await request.get("/product/dish-washing-liquid");
  return res.ok() && (await res.text()).includes("SBX-DISH-550");
}

/** Looks up sandbox product / variation ids by slug (ids depend on seed order). */
export async function sandboxIds(request: APIRequestContext) {
  const get = async (slug: string) => {
    const res = await request.get(`${SANDBOX}/wp-json/wc/store/v1/products?slug=${slug}`);
    const [product] = (await res.json()) as {
      id: number;
      variations: { id: number; attributes: { name: string; value: string }[] }[];
    }[];
    return product;
  };
  const [dish, air] = await Promise.all([get("dish-washing-liquid"), get("air-freshener")]);
  const variation = (value: string) => air.variations.find((v) => v.attributes[0]?.value === value)!.id;
  return {
    dish: dish.id,
    airFreshener: air.id,
    cinnamon: variation("Cinnamon"),
    greenApple: variation("Green Apple"),
  };
}
