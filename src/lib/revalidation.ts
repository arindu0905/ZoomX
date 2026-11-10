/**
 * Maps a WooCommerce webhook (topic + payload) to the cache tags it
 * invalidates. Pure, so it is unit-tested without Next.js.
 *
 * Tags are those assigned in services/woocommerce/catalog.ts.
 */

export const ALLOWED_TAG = /^(products|categories|product:\d{1,12})$/;

interface WebhookPayload {
  id?: unknown;
  parent_id?: unknown;
  line_items?: unknown;
}

const asId = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);

export function tagsForWebhook(topic: string, payload: WebhookPayload): string[] {
  const tags = new Set<string>();
  const [resource] = topic.split(".");

  if (resource === "product") {
    // Price, stock, name, images or visibility changed — and category counts may too.
    tags.add("products");
    tags.add("categories");
    for (const id of [asId(payload.id), asId(payload.parent_id)]) if (id) tags.add(`product:${id}`);
  } else if (resource === "order") {
    // Orders change stock levels; refresh product data so availability isn't stale.
    // WooCommerce still re-checks stock at checkout, which is what prevents overselling.
    tags.add("products");
    if (Array.isArray(payload.line_items)) {
      for (const item of payload.line_items as { product_id?: unknown; variation_id?: unknown }[]) {
        for (const id of [asId(item?.product_id), asId(item?.variation_id)]) if (id) tags.add(`product:${id}`);
      }
    }
  } else if (resource === "action" && /product_cat/.test(topic)) {
    // Action-based webhook, e.g. "action.edited_product_cat".
    tags.add("categories");
  }

  return [...tags].filter((t) => ALLOWED_TAG.test(t));
}
