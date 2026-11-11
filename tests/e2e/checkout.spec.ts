import { expect, test, type Page } from "@playwright/test";
import { hasSandboxCatalogue } from "./store";

/**
 * Full purchase journey against the WooCommerce sandbox: add → bag → coupon →
 * checkout (Cash on Delivery) → confirmation read back from WooCommerce.
 * Uses only placeholder test data. Each test has its own browser context,
 * so its own WooCommerce cart session.
 */
test.beforeEach(async ({ request }) => {
  test.skip(!(await hasSandboxCatalogue(request)), "needs the WooCommerce sandbox");
});

// The WASM sandbox is slow under parallel load.
test.setTimeout(90_000);
const slow = { timeout: 20_000 };

// Air Freshener (Cinnamon): LKR 750.00 sandbox placeholder price.
async function addCinnamon(page: Page) {
  await page.goto("/product/air-freshener");
  await page.getByRole("radio", { name: "Cinnamon" }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  const bag = page.getByRole("dialog", { name: /Bag/ });
  await expect(bag.getByText("Fragrance: Cinnamon")).toBeVisible(slow);
  return bag;
}

test("add to bag opens the drawer and updates the badge", async ({ page }) => {
  const bag = await addCinnamon(page);
  await expect(bag.getByText("LKR 750.00").first()).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Shopping bag, 1 item" }),
  ).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(bag).toBeHidden();
});

test("bag page: persistence, quantity, coupons and WooCommerce totals", async ({ page }) => {
  await addCinnamon(page);
  await page.goto("/cart"); // full reload: cart comes back from the WooCommerce session
  await expect(page.getByText("Fragrance: Cinnamon")).toBeVisible(slow);

  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByText("LKR 1,500.00").first()).toBeVisible(slow);

  const coupon = page.getByRole("textbox", { name: "Coupon code" });
  await coupon.fill("NOPE");
  await coupon.press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "does not exist" })).toBeVisible(slow);

  await coupon.fill("SANDBOX10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("−LKR 150.00").first()).toBeVisible(slow);
  // 2 × 750 − 10% + 350 sandbox delivery, as calculated by WooCommerce
  await expect(page.getByText("LKR 1,700.00")).toBeVisible();

  await page.getByRole("button", { name: "Remove", exact: false }).first().click();
  await expect(page.getByRole("heading", { name: "Your bag is empty." })).toBeVisible(slow);
});

test("checkout validates, places a Cash on Delivery order and shows the confirmation", async ({ page }) => {
  await addCinnamon(page);
  await page.goto("/checkout");
  const place = page.getByRole("button", { name: /Place order · LKR 1,100.00/ });
  await expect(place).toBeVisible(slow);

  await place.click();
  await expect(page.getByText("Enter a Sri Lankan phone number, e.g. 077 123 4567.")).toBeVisible();
  await expect(page.getByText("Please accept the terms and conditions.")).toBeVisible();

  await page.getByLabel("Email").fill("sandbox-buyer@example.test");
  await page.getByLabel("Phone").fill("077 123 4567");
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Buyer");
  await page.getByLabel("Address", { exact: true }).fill("12 Sample Road");
  await page.getByLabel("City / town").fill("Ratmalana");
  await page.getByLabel("District").selectOption("Colombo");
  await page.getByLabel("Postal code").fill("10390");
  await page.getByLabel("Delivery instructions").fill("Sandbox test order");
  await expect(page.getByRole("radio", { name: /Cash on delivery/ })).toBeChecked();
  await page.getByRole("checkbox", { name: /terms and conditions/ }).check();
  await place.click();

  await expect(page).toHaveURL(/\/checkout\/order\/\d+\?key=wc_order_/, slow);
  await expect(page.getByRole("heading", { name: "Thank you, Test." })).toBeVisible(slow);
  await expect(page.getByText("Processing")).toBeVisible();
  await expect(page.getByText("Air Freshener - Cinnamon")).toBeVisible();
  await expect(page.getByText(/Please have LKR 1,100.00 ready in cash/)).toBeVisible();
  await expect(page.getByText("+94771234567")).toBeVisible();
  await expect(page.getByText("Ratmalana, Colombo")).toBeVisible();

  // WooCommerce emptied the cart.
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Shopping bag", exact: true }),
  ).toBeAttached(slow);
});

test("order confirmation requires the order key", async ({ page }) => {
  await page.goto("/checkout/order/1?key=wc_order_wrongkey123");
  await expect(page.getByRole("heading", { name: "We can’t show this order." })).toBeVisible(slow);
  await page.goto("/checkout/order/1");
  await expect(page.getByRole("heading", { name: "We can’t show this order." })).toBeVisible(slow);
});

test("checkout API rejects tampered or invalid submissions", async ({ request, baseURL }, info) => {
  test.skip(info.project.name !== "desktop-chromium", "API-level check runs once");
  const headers = { Origin: baseURL!, "Content-Type": "application/json" };
  const base = {
    email: "sandbox-buyer@example.test",
    phone: "0771234567",
    billing: {
      firstName: "T",
      lastName: "B",
      address1: "1 Road",
      city: "Ratmalana",
      district: "Colombo",
      postcode: "10390",
    },
    terms: true,
  };
  const unsupported = await request.post("/api/checkout", { headers, data: { ...base, paymentMethod: "bacs" } });
  expect(unsupported.status()).toBe(400);
  const empty = await request.post("/api/checkout", { headers, data: { ...base, paymentMethod: "cod" } });
  expect(empty.status()).toBe(409); // fresh session: empty bag
  const invalid = await request.post("/api/checkout", {
    headers,
    data: { ...base, terms: false, paymentMethod: "cod" },
  });
  expect(invalid.status()).toBe(400);
});

test.describe("PayHere without credentials", () => {
  test.skip(!!process.env.PAYHERE_MERCHANT_SECRET, "PayHere is configured in this environment");

  test("is neither offered at checkout nor accepted by the API", async ({ page, request, baseURL }) => {
    await addCinnamon(page);
    await page.goto("/checkout");
    await expect(page.getByRole("radio", { name: /Cash on delivery/ })).toBeVisible(slow);
    await expect(page.getByRole("radio", { name: /PayHere|Card or mobile wallet/ })).toHaveCount(0);

    const res = await request.post("/api/checkout", {
      headers: { Origin: baseURL!, "Content-Type": "application/json" },
      data: {
        email: "sandbox-buyer@example.test",
        phone: "0771234567",
        billing: {
          firstName: "T",
          lastName: "B",
          address1: "1 Road",
          city: "Ratmalana",
          district: "Colombo",
          postcode: "10390",
        },
        paymentMethod: "zoomx_payhere",
        terms: true,
      },
    });
    expect(res.status()).toBe(400);
  });

  test("the notify endpoint refuses to process anything", async ({ request }, info) => {
    test.skip(info.project.name !== "desktop-chromium", "API-level check runs once");
    const res = await request.post("/api/payments/payhere/notify", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: "merchant_id=1&order_id=1&payment_id=1&payhere_amount=1.00&payhere_currency=LKR&status_code=2&md5sig=00000000000000000000000000000000",
    });
    expect(res.status()).toBe(503);
  });
});
