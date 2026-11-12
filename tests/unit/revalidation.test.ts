import { describe, expect, it } from "vitest";
import { ALLOWED_TAG, tagsForWebhook } from "@/lib/revalidation";

describe("tagsForWebhook", () => {
  it("product updates refresh lists, categories, the product (and its parent) and the admin", () => {
    expect(tagsForWebhook("product.updated", { id: 17, parent_id: 15 }).sort()).toEqual(
      ["admin", "categories", "product:15", "product:17", "products"].sort(),
    );
  });

  it("product deletion still refreshes lists", () => {
    expect(tagsForWebhook("product.deleted", { id: 9 })).toContain("products");
  });

  it("orders refresh stock for their line items and the admin dashboard", () => {
    expect(
      tagsForWebhook("order.created", { line_items: [{ product_id: 15, variation_id: 17 }, { product_id: 3 }] }).sort(),
    ).toEqual(["admin", "product:15", "product:17", "product:3", "products"].sort());
  });

  it("ignores malformed ids", () => {
    expect(tagsForWebhook("product.updated", { id: "17; drop" }).sort()).toEqual(["admin", "categories", "products"]);
  });

  it("customer and coupon changes refresh only the admin", () => {
    expect(tagsForWebhook("coupon.updated", { id: 1 })).toEqual(["admin"]);
    expect(tagsForWebhook("customer.created", { id: 4 })).toEqual(["admin"]);
  });

  it("ignores unknown topics", () => {
    expect(tagsForWebhook("subscription.updated", { id: 1 })).toEqual([]);
  });

  it("handles category action webhooks", () => {
    expect(tagsForWebhook("action.edited_product_cat", {}).sort()).toEqual(["admin", "categories"]);
  });

  it("only produces tags the revalidate endpoint accepts", () => {
    for (const t of tagsForWebhook("order.created", { line_items: [{ product_id: 1 }] })) expect(ALLOWED_TAG.test(t)).toBe(true);
  });
});
