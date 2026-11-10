import { expect, test } from "@playwright/test";

test("home renders brand heading and metadata", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "ZOOM X" })).toBeVisible();
  await expect(page).toHaveTitle(/ZOOM X/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en-LK");
});
