import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountLoading, AccountShell } from "@/components/account/account-shell";
import { OrderList } from "@/components/account/order-list";
import { getCustomerSession } from "@/services/auth/session";
import { listCustomerOrders } from "@/services/woocommerce/customers";

export const metadata: Metadata = { title: "Your orders", robots: { index: false, follow: false } };

export default function OrdersPage() {
  return (
    <Suspense fallback={<AccountLoading />}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  const session = await getCustomerSession();
  if (!session) redirect("/account");
  const orders = await listCustomerOrders(session.customerId, 50);
  return (
    <AccountShell title="Orders." current="/account/orders">
      <OrderList orders={orders} />
    </AccountShell>
  );
}
