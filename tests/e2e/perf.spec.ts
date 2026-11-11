import { expect, test } from "@playwright/test";

/**
 * Lightweight performance budget against the local production build:
 * JavaScript transferred and Largest Contentful Paint. Not a substitute for
 * Lighthouse / field data on the real host, but catches regressions.
 */
const BUDGET_JS_KB = 350; // compressed JavaScript per page
const BUDGET_LCP_MS = 2500; // "good" LCP threshold

for (const path of ["/", "/shop", "/product/air-freshener"]) {
  test(`performance budget: ${path}`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop-chromium", "measured once");
    await page.goto(path, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(async () => {
      const lcp = await new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries[entries.length - 1]?.startTime ?? 0);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => resolve(0), 3000);
      });
      const js = performance
        .getEntriesByType("resource")
        .filter((e) => (e as PerformanceResourceTiming).initiatorType === "script")
        .reduce((sum, e) => sum + (e as PerformanceResourceTiming).transferSize, 0);
      return { lcp, jsKb: Math.round(js / 1024) };
    });
    info.annotations.push({
      type: "perf",
      description: `${path}: LCP ${Math.round(metrics.lcp)} ms, JS ${metrics.jsKb} KB`,
    });
    console.log(`[perf] ${path}: LCP ${Math.round(metrics.lcp)} ms, JS ${metrics.jsKb} KB`);
    expect(metrics.jsKb).toBeLessThan(BUDGET_JS_KB);
    expect(metrics.lcp).toBeLessThan(BUDGET_LCP_MS);
  });
}
