import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountLoading, AccountShell } from "@/components/account/account-shell";
import { LoginForm, RegisterForm } from "@/components/account/auth-forms";
import { OrderList } from "@/components/account/order-list";
import { Container } from "@/components/ui/layout";
import { getCustomerSession } from "@/services/auth/session";
import { getCustomer, listCustomerOrders } from "@/services/woocommerce/customers";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const session = await getCustomerSession();
  if (!session) return <SignedOut />;

  const [customer, orders] = await Promise.all([
    getCustomer(session.customerId),
    listCustomerOrders(session.customerId, 3),
  ]);
  return (
    <AccountShell title={`Hello, ${customer.first_name || "there"}.`} current="/account">
      <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="recent-orders">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="recent-orders" className="text-title">
              Recent orders
            </h2>
            <Link href="/account/orders" className="text-body text-brand-strong hover:underline">
              View all
            </Link>
          </div>
          <OrderList orders={orders} />
        </section>
        <aside className="h-fit rounded-3xl bg-canvas-alt p-6">
          <h2 className="text-lg font-semibold">Your details</h2>
          <p className="mt-2 text-body text-ink-muted">
            {customer.first_name} {customer.last_name}
            <br />
            {customer.email}
          </p>
          <Link href="/account/details" className="mt-4 inline-block text-body text-brand-strong hover:underline">
            Edit details &amp; address
          </Link>
        </aside>
      </div>
    </AccountShell>
  );
}

function SignedOut() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="text-display">Account.</h1>
      <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-20">
        <section aria-labelledby="sign-in">
          <h2 id="sign-in" className="mb-6 text-title">
            Sign in
          </h2>
          <LoginForm />
        </section>
        <section aria-labelledby="create-account" className="lg:border-l lg:border-line lg:pl-20">
          <h2 id="create-account" className="mb-2 text-title">
            Create an account
          </h2>
          <p className="mb-6 text-body text-ink-muted">Track orders and check out faster.</p>
          <RegisterForm />
        </section>
      </div>
      <p className="mt-12 text-center text-body text-ink-muted">
        Ordered as a guest?{" "}
        <Link href="/orders/track" className="text-brand-strong underline underline-offset-4">
          Track your order
        </Link>
      </p>
    </Container>
  );
}
