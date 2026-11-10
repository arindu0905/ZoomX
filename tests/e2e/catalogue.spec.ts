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
    await expect(page.getByRole("heading", { level: 1, name: "Shop." })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "6 products" })).toBeVisible();
    const floor = page.locator("article", { hasText: "Sandbox Floor Cleaner" });
    await expect(floor.getByText("Sale", { exact: true })).toBeVisible();
    await expect(floor.getByText("LKR 750.00")).toBeVisible();
    await expect(page.locator("article", { hasText: "Sandbox Glass Cleaner" }).getByText("Out of stock")).toBeVisible();
  });

  test("sorts by price", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Sort by").selectOption("price-asc");
    await expect(page).toHaveURL(/\/shop\?sort=price-asc$/);
    await expect.poll(async () => (await names(page))[0]).toBe("Sandbox Glass Cleaner");
    await page.getByLabel("Sort by").selectOption("price-desc");
    await expect(page).toHaveURL(/sort=price-desc/);
    await expect.poll(async () => (await names(page))[0]).toBe("Sandbox Laundry Liquid"); // variable products sort by their highest price
  });

  test("filters by category with a clean URL", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Category").selectOption("sandbox-laundry");
    await expect(page).toHaveURL(/\/shop\?category=sandbox-laundry$/);
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
      .toEqual(["Sandbox Floor Cleaner", "Sandbox Laundry Liquid", "Sandbox Multi-Purpose Spray"]);
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
    await page.goto("/shop?search=floor");
    await expect.poll(() => names(page)).toEqual(["Sandbox Floor Cleaner"]);
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
    await expect(dialog.getByRole("link", { name: /Sandbox Laundry Liquid/ })).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByRole("link", { name: "Sandbox Laundry", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Clear" }).click();
    await expect(dialog.getByText("Quick links")).toBeVisible();
  });
});

test.describe("category page", () => {
  test("shows the category with breadcrumbs and only its products", async ({ page }) => {
    await page.goto("/category/sandbox-surfaces");
    await expect(page.getByRole("heading", { level: 1, name: "Sandbox Surfaces." })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Shop" }),
    ).toBeVisible();
    await expect
      .poll(async () => (await names(page)).sort())
      .toEqual(["Sandbox Floor Cleaner", "Sandbox Glass Cleaner", "Sandbox Multi-Purpose Spray"]);
  });

  test("returns the not-found page for an unknown category", async ({ page }) => {
    await page.goto("/category/no-such-category");
    await expect(page.getByRole("heading", { level: 1, name: "This page isn’t here." })).toBeVisible();
  });
});

test.describe("product page", () => {
  test("simple product shows price, SKU and stock", async ({ page }) => {
    await page.goto("/product/sandbox-floor-cleaner");
    await expect(page.getByRole("heading", { level: 1, name: "Sandbox Floor Cleaner" })).toBeVisible();
    await expect(page.getByText("SKU: SBX-FLOOR-1L")).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: /\d+ in stock/ })).toBeVisible();
  });

  test("out-of-stock product cannot be bought", async ({ page }) => {
    await page.goto("/product/sandbox-glass-cleaner");
    await expect(page.getByRole("status").filter({ hasText: "Out of stock" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to bag" })).toBeDisabled();
  });

  test("variable product updates price, SKU and stock per size", async ({ page }) => {
    await page.goto("/product/sandbox-laundry-liquid");
    await expect(page.getByText("From LKR 700.00")).toBeVisible();
    await expect(page.getByText("Choose an option to see availability.")).toBeVisible();

    await page.getByRole("radio", { name: "1 L" }).click();
    await expect(page.getByText("LKR 1,100.00")).toBeVisible();
    await expect(page.getByText("SKU: SBX-LAUNDRY-1L")).toBeVisible();
    // Exact counts drift: the checkout specs place real sandbox orders.
    await expect(page.getByRole("status").filter({ hasText: /\d+ in stock/ })).toBeVisible();

    const twoLitre = page.getByRole("radio", { name: /2 L/ });
    await expect(twoLitre).toContainText("unavailable");
    await twoLitre.click();
    await expect(page.getByRole("status").filter({ hasText: "Out of stock" })).toBeVisible();
  });

  test("emits Product structured data matching WooCommerce", async ({ page }) => {
    await page.goto("/product/sandbox-laundry-liquid");
    const ld = await page.$$eval('script[type="application/ld+json"]', (els) =>
      els.map((e) => JSON.parse(e.textContent!)),
    );
    const product = ld.find((d) => d["@type"] === "Product");
    expect(product.offers).toHaveLength(3);
    expect(product.offers.map((o: { price: string }) => o.price)).toEqual(["700.00", "1100.00", "2300.00"]);
    expect(product.offers[2].availability).toBe("https://schema.org/OutOfStock");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/product\/sandbox-laundry-liquid$/);
  });

  test("shows related products from the same category", async ({ page }) => {
    await page.goto("/product/sandbox-floor-cleaner");
    const related = page.locator("#related-title").locator("xpath=ancestor::section");
    await expect(related.getByRole("link", { name: "Sandbox Multi-Purpose Spray" })).toBeVisible();
    await expect(related.getByRole("link", { name: "Sandbox Floor Cleaner" })).toHaveCount(0);
  });
});
