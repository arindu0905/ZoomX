import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Automated WCAG 2.1 A/AA scan of key pages (axe-core). Automated checks
 * catch roughly a third of issues; keyboard and screen-reader passes are
 * still done by hand (see docs).
 */
const pages = [
  "/",
  "/shop",
  "/product/air-freshener",
  "/cart",
  "/checkout",
  "/account",
  "/orders/track",
  "/about",
  "/contact",
  "/policies/terms",
  "/does-not-exist",
];

for (const path of pages) {
  test(`no WCAG A/AA violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
    );
    expect(summary).toEqual([]);
  });
}

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).toContain(
    "form-action 'self' https://sandbox.payhere.lk https://www.payhere.lk",
  );
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("robots and sitemap", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/about</loc>");
  expect(sitemap).not.toContain("/checkout");
  expect(sitemap).not.toContain("/policies/terms"); // draft until approved
});
