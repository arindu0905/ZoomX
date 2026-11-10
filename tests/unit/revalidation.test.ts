import { describe, expect, it } from "vitest";
import { tagsForWebhook } from "@/lib/revalidation";

describe("tagsForWebhook", () => {
  it("product updates refresh lists, categories and the product (and its parent)", () => {
    expect(tagsForWebhook("product.updated", { id: 17, parent_id: 15 }).sort()).toEqual(
      ["categories", "product:15", "product:17", "products"].sort(),
    );
  });

  it("product deletion still refreshes lists", () => {
    expect(tagsForWebhook("product.deleted", { id: 9 })).toContain("products");
  });

  it("orders refresh stock for their line items", () => {
    expect(
      tagsForWebhook("order.created", { line_items: [{ product_id: 15, variation_id: 17 }, { product_id: 3 }] }).sort(),
    ).toEqual(["product:15", "product:17", "product:3", "products"].sort());
  });

  it("ignores malformed ids and unknown topics", () => {
    expect(tagsForWebhook("product.updated", { id: "17; drop" })).toEqual(["products", "categories"]);
    expect(tagsForWebhook("coupon.updated", { id: 1 })).toEqual([]);
  });

  it("handles category action webhooks", () => {
    expect(tagsForWebhook("action.edited_product_cat", {})).toEqual(["categories"]);
  });
});
