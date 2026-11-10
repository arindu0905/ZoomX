import { expect, test } from "@playwright/test";

test("home renders brand heading and metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "ZOOM X home" }).first()).toBeVisible();
  await expect(page).toHaveTitle(/ZOOM X/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en-LK");
});

test("skip link moves focus to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("search submits to the shop", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search products" }).click();
  const input = page.getByRole("searchbox", { name: "Search ZOOM X products" });
  await expect(input).toBeFocused();
  await input.fill("dish wash");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/shop\?search=dish\+wash$/);
});

test("unknown routes render the branded 404", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page isn’t here." })).toBeVisible();
});

test("no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
