import { expect, test } from "@playwright/test";

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("menu opens, traps focus and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Shop" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  });
});

test.describe("desktop navigation", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop only");

  test("primary links and categories flyout are keyboard reachable", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const name of ["Home", "Shop", "About", "Contact"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    const categories = nav.getByRole("button", { name: "Categories" });
    await categories.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Shop by category" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(categories).toHaveAttribute("aria-expanded", "false");
  });
});
