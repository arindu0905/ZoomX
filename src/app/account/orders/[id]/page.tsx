import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountLoading, AccountShell } from "@/components/account/account-shell";
import { OrderDetails } from "@/components/orders/order-details";
import { ButtonLink } from "@/components/ui/button";
import { getCustomerSession } from "@/services/auth/session";
import { getCustomerOrder } from "@/services/woocommerce/customers";

export const metadata: Metadata = { title: "Order details", robots: { index: false, follow: false } };

export default function AccountOrderPage(props: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountOrder {...props} />
    </Suspense>
  );
}

async function AccountOrder({ params }: PageProps<"/account/orders/[id]">) {
  const session = await getCustomerSession();
  if (!session) redirect("/account");
  const { id } = await params;
  // Only returns the order if it belongs to the signed-in customer.
  const order = await getCustomerOrder(Number(id), session.customerId);

  return (
    <AccountShell title={order ? `Order #${order.number}.` : "Order not found."} current="/account/orders">
      {order ? (
        <div className="max-w-3xl">
          <OrderDetails order={order} />
        </div>
      ) : (
        <p className="text-body text-ink-muted">We couldn’t find that order in your account.</p>
      )}
      <ButtonLink href="/account/orders" variant="link" className="mt-10 text-body">
        ← All orders
      </ButtonLink>
    </AccountShell>
  );
}
