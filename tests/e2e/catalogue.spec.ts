import { expect, test } from "@playwright/test";
import { hasSandboxCatalogue } from "./store";

/**
 * Runs against the local WooCommerce sandbox (`npm run sandbox`, seeded by
 * sandbox/seed.php). Skipped automatically when no store is connected.
 */
test.beforeEach(async ({ request }) => {
  test.skip(!(await hasSandboxCatalogue(request)), "needs the WooCommerce sandbox");
});

const names = (page: import("@playwright/test").Page) => page.locator("main ul h3").allTextContents();

test.describe("shop", () => {
  test("lists products with prices, sale and stock state", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1, name: "All products" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "10 products" })).toBeVisible();
    const onSale = page.locator("article", { hasText: "General Purpose Cleaner" });
    await expect(onSale.getByText("Sale", { exact: true })).toBeVisible();
    await expect(onSale.getByText("LKR 590.00")).toBeVisible();
    await expect(page.locator("article", { hasText: "Tile Cleaner" }).getByText("Sold out")).toBeVisible();
  });

  test("sorts by price", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Sort by").selectOption("price-asc");
    await expect(page).toHaveURL(/\/shop\?sort=price-asc$/);
    await expect.poll(async () => (await names(page))[0]).toBe("Hand Wash");
    await page.getByLabel("Sort by").selectOption("price-desc");
    await expect(page).toHaveURL(/sort=price-desc/);
    await expect.poll(async () => (await names(page))[0]).toBe("Laundry Detergent");
  });

  test("filters by category with a clean URL", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Category").selectOption("laundry-care");
    await expect(page).toHaveURL(/\/shop\?category=laundry-care$/);
    await expect(page.getByRole("status").filter({ hasText: "2 products" })).toBeVisible();
  });

  test("filters by price range", async ({ page }) => {
    await page.goto("/shop");
    await page.locator("summary", { hasText: "Price" }).click();
    await page.getByLabel("Min (LKR)").fill("700");
    await page.getByLabel("Max (LKR)").fill("800");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/min=700&max=800/);
    await expect
      .poll(async () => (await names(page)).sort())
      .toEqual(["Air Freshener", "All Purpose & All Surface", "Tile Cleaner", "Toilet Bowl Cleaner"]);
  });

  test("paginates nothing on a single page and handles an out-of-range page", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("navigation", { name: "Pagination" })).toHaveCount(0);
    await page.goto("/shop?page=50");
    await expect(page.getByRole("heading", { name: "No products match these filters." })).toBeVisible();
  });
});

test.describe("search", () => {
  test("shows results and a no-result state", async ({ page }) => {
    await page.goto("/shop?search=toilet");
    await expect.poll(() => names(page)).toEqual(["Toilet Bowl Cleaner"]);
    await page.goto("/shop?search=zzzz-nothing");
    await expect(page.getByRole("heading", { name: "No results for “zzzz-nothing”." })).toBeVisible();
    await page.getByRole("link", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/shop$/);
  });

  test("header search suggests products", async ({ page, isMobile }) => {
    test.skip(isMobile, "search entry is covered by navigation specs on mobile");
    await page.goto("/");
    await page.getByRole("button", { name: "Search products" }).click();
    await page.getByLabel("Search ZOOM X products").fill("laundry");
    const dialog = page.getByRole("dialog", { name: "Search" });
    // The WASM sandbox is slow under parallel load; production WooCommerce answers far faster.
    await expect(dialog.getByRole("link", { name: /Laundry Detergent/ })).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByRole("link", { name: "Laundry Care", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Clear" }).click();
    await expect(dialog.getByText("Quick links")).toBeVisible();
  });
});

test.describe("category page", () => {
  test("shows the category with breadcrumbs and only its products", async ({ page }) => {
    await page.goto("/category/surface-cleaners");
    await expect(page.getByRole("heading", { level: 1, name: "Surface Cleaners" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Shop" }),
    ).toBeVisible();
    await expect
      .poll(async () => (await names(page)).sort())
      .toEqual(["All Purpose & All Surface", "General Purpose Cleaner", "Glass Cleaner", "Tile Cleaner"]);
  });

  test("returns the not-found page for an unknown category", async ({ page }) => {
    await page.goto("/category/no-such-category");
    await expect(page.getByRole("heading", { level: 1, name: "This page isn’t here." })).toBeVisible();
  });
});

test.describe("product page", () => {
  test("simple product shows price, SKU and stock", async ({ page }) => {
    await page.goto("/product/general-purpose-cleaner");
    await expect(page.getByRole("heading", { level: 1, name: "General Purpose Cleaner" })).toBeVisible();
    await expect(page.getByText("SKU: SBX-GPC-550")).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: /\d+ in stock/ })).toBeVisible();
  });

  test("out-of-stock product cannot be bought", async ({ page }) => {
    await page.goto("/product/tile-cleaner");
    await expect(page.getByRole("status").filter({ hasText: "Out of stock" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sold out" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Buy it now" })).toBeDisabled();
  });

  test("variable product updates price, SKU and stock per fragrance", async ({ page }) => {
    await page.goto("/product/air-freshener");
    await expect(page.getByText("From LKR 650.00")).toBeVisible();
    await expect(page.getByText("Choose an option to see availability.")).toBeVisible();

    await page.getByRole("radio", { name: "Cinnamon" }).click();
    await expect(page.getByText("LKR 750.00")).toBeVisible();
    await expect(page.getByText("SKU: SBX-AIR-CIN-550")).toBeVisible();
    // Exact counts drift: the checkout specs place real sandbox orders.
    await expect(page.getByRole("status").filter({ hasText: /\d+ in stock/ })).toBeVisible();

    const greenApple = page.getByRole("radio", { name: /Green Apple/ });
    await expect(greenApple).toContainText("unavailable");
    await greenApple.click();
    await expect(page.getByRole("status").filter({ hasText: "Out of stock" })).toBeVisible();
  });

  test("emits Product structured data matching WooCommerce", async ({ page }) => {
    await page.goto("/product/air-freshener");
    const ld = await page.$$eval('script[type="application/ld+json"]', (els) =>
      els.map((e) => JSON.parse(e.textContent!)),
    );
    const product = ld.find((d) => d["@type"] === "Product");
    expect(product.offers).toHaveLength(2);
    expect(product.offers.map((o: { price: string }) => o.price)).toEqual(["750.00", "650.00"]);
    expect(product.offers[1].availability).toBe("https://schema.org/OutOfStock");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/product\/air-freshener$/);
  });

  test("shows related products from the same category", async ({ page }) => {
    await page.goto("/product/general-purpose-cleaner");
    const related = page.locator("#related-title").locator("xpath=ancestor::section");
    await expect(related.getByRole("link", { name: "All Purpose & All Surface" })).toBeVisible();
    await expect(related.getByRole("link", { name: "General Purpose Cleaner" })).toHaveCount(0);
  });
});
