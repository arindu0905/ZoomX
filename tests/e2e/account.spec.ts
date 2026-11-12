import { expect, test, type Page } from "@playwright/test";
import { hasSandboxCatalogue } from "./store";

/**
 * Customer accounts against the WooCommerce sandbox (zoomx-headless plugin
 * auth endpoints). Uses unique throwaway .test addresses per run.
 */
test.beforeEach(async ({ request }, info) => {
  // Account flows aren't layout-specific; run once (also keeps registrations
  // under the per-IP rate limit, which this suite would otherwise trip).
  test.skip(info.project.name !== "desktop-chromium", "account flows run on desktop only");
  test.skip(!(await hasSandboxCatalogue(request)), "needs the WooCommerce sandbox");
  test.skip(!process.env.WORDPRESS_AUTH_SECRET, "WORDPRESS_AUTH_SECRET not set");
});
test.setTimeout(120_000);
const slow = { timeout: 20_000 };

const PASSWORD = "Sandbox-pass-1234"; // test-only
const uniqueEmail = () => `sbx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;

async function register(page: Page, email: string) {
  await page.goto("/account");
  const form = page.getByRole("region", { name: "Create an account" });
  await form.getByLabel("First name").fill("Sam");
  await form.getByLabel("Last name").fill("Customer");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Password").fill(PASSWORD);
  await form.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Hello, Sam." })).toBeVisible(slow);
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/account");
  const form = page.getByRole("region", { name: "Sign in" });
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Password").fill(password);
  await form.getByRole("button", { name: "Sign in" }).click();
}

async function placeCodOrder(page: Page, email: string) {
  await page.goto("/product/dish-washing-liquid");
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("dialog", { name: /Bag/ })).toBeVisible(slow);
  await page.goto("/checkout");
  await expect(page.getByRole("button", { name: /Place order/ })).toBeVisible(slow);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill("0771234567");
  await page.getByLabel("First name").fill("Sam");
  await page.getByLabel("Last name").fill("Customer");
  await page.getByLabel("Address", { exact: true }).fill("12 Sample Road");
  await page.getByLabel("City / town").fill("Ratmalana");
  await page.getByLabel("District").selectOption("Colombo");
  await page.getByLabel("Postal code").fill("10390");
  await page.getByRole("checkbox", { name: /terms and conditions/ }).check();
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page).toHaveURL(/\/checkout\/order\/(\d+)\?key=/, slow);
  return Number(/\/checkout\/order\/(\d+)/.exec(page.url())![1]);
}

test("register, sign out, wrong password, sign in", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  // The session is an HttpOnly cookie.
  const session = (await page.context().cookies()).find((c) => c.name === "zx_session");
  expect(session?.httpOnly).toBe(true);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("region", { name: "Sign in" })).toBeVisible(slow);

  await signIn(page, email, "not-the-password");
  await expect(page.getByRole("alert").filter({ hasText: "Incorrect email or password." })).toBeVisible(slow);

  await signIn(page, email);
  await expect(page.getByRole("heading", { level: 1, name: "Hello, Sam." })).toBeVisible(slow);
});

test("orders placed while signed in appear in the account; details can be saved", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  const orderId = await placeCodOrder(page, email);

  await page.goto("/account/orders");
  await expect(page.getByRole("link", { name: new RegExp(`Order #${orderId}`) })).toBeVisible(slow);
  await page.getByRole("link", { name: new RegExp(`Order #${orderId}`) }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Order #${orderId}.` })).toBeVisible(slow);
  await expect(page.getByText("Dish Washing Liquid")).toBeVisible();

  await page.goto("/account/details");
  await page.getByLabel("Phone").fill("077 765 4321");
  await page.getByLabel("Address", { exact: true }).fill("5 Lake Road");
  await page.getByLabel("City / town").fill("Kandy");
  await page.getByLabel("District").selectOption("Kandy");
  await page.getByLabel("Postal code").fill("20000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Your details have been saved." })).toBeVisible(slow);
  await page.reload();
  await expect(page.getByLabel("City / town")).toHaveValue("Kandy", slow);
  await expect(page.getByLabel("Phone")).toHaveValue("+94777654321");
});

test("a customer can't open another customer's order", async ({ page, browser }) => {
  const ownerEmail = uniqueEmail();
  await register(page, ownerEmail);
  const orderId = await placeCodOrder(page, ownerEmail);

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await register(otherPage, uniqueEmail());
  await otherPage.goto(`/account/orders/${orderId}`);
  await expect(otherPage.getByRole("heading", { level: 1, name: "Order not found." })).toBeVisible(slow);
  await other.close();
});

test("account pages require sign-in", async ({ page }) => {
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/account$/, slow);
  await expect(page.getByRole("region", { name: "Sign in" })).toBeVisible();
});

test("guest order tracking needs the right order number and email", async ({ page }) => {
  const email = uniqueEmail();
  const orderId = await placeCodOrder(page, email); // guest order

  await page.goto("/orders/track");
  await page.getByLabel("Order number").fill(String(orderId));
  await page.getByLabel("Email used for the order").fill("someone-else@example.test");
  await page.getByRole("button", { name: "Track order" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "We couldn’t find an order with that number and email." }),
  ).toBeVisible(slow);

  await page.getByLabel("Email used for the order").fill(email.toUpperCase());
  await page.getByRole("button", { name: "Track order" }).click();
  await expect(page).toHaveURL(new RegExp(`/checkout/order/${orderId}\\?key=`), slow);
  await expect(page.getByText(`#${orderId}`).first()).toBeVisible();
});

test("password reset: generic request message and invalid key handling", async ({ page }) => {
  await page.goto("/account/forgot");
  await page.getByLabel("Email").fill("nobody-here@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "If an account exists for that email" })).toBeVisible(slow);

  await page.goto("/account/reset?key=invalid&login=nobody-here@example.test");
  await page.getByLabel("New password").fill("Another-pass-1234");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "invalid or has expired" })).toBeVisible(slow);
});

test("auth endpoints reject cross-site requests", async ({ request }) => {
  const res = await request.post("/api/auth/login", {
    headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
    data: { email: "a@example.test", password: "x" },
  });
  expect(res.status()).toBe(403);
});
