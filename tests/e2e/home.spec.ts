import { expect, test } from "@playwright/test";
import { hasSandboxCatalogue } from "./store";

test.describe("homepage", () => {
  test("renders the core sections with real brand copy", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Pure Power, Gentle Touch.",
      }),
    ).toBeVisible();
    for (const name of [
      "Everything your home needs to feel fresh.",
      "Big mess? Simple clean.",
      "Where clean meets care.",
      "Clean that cares.",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeAttached();
    }
  });

  test("range links search the shop", async ({ page, request }) => {
    test.skip(await hasSandboxCatalogue(request), "store categories replace the fallback range");
    await page.goto("/");
    const link = page.getByRole("link", { name: "Laundry Detergent" }).last();
    await expect(link).toHaveAttribute("href", "/shop?search=Laundry%20Detergent");
  });

  test("hides product rails and unverifiable content without WooCommerce data", async ({ page, request }) => {
    test.skip(await hasSandboxCatalogue(request), "requires an app without WooCommerce data");
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Our most popular products." })).toHaveCount(0);
    await expect(page.getByText(/99\.9%|dermatologically/i)).toHaveCount(0);
    await expect(page.getByText(/testimonial/i)).toHaveCount(0);
  });

  test("has exactly one h1 and a sensible heading order", async ({ page }) => {
    await page.goto("/");
    const levels = await page.$$eval("main h1, main h2, main h3", (els) => els.map((e) => Number(e.tagName[1])));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  });
});
