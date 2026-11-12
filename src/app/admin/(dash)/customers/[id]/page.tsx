import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCustomerAction, updateCustomerAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CustomerFields } from "@/components/admin/customer-fields";
import { adminDate, adminMoney } from "@/components/admin/format";
import { AdminButton, Badge, Card, isNotFound, PageHeader, SearchParamsNotice } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { getCustomer, listOrders } from "@/services/admin/woo";
/** Live per request behind the staff check; not validated for instant navigation (see ../layout.tsx). */export const instant = false;

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params, searchParams }: PageProps<"/admin/customers/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [, sp, customer] = await Promise.all([
    requireStaff(),
    searchParams,
    getCustomer(id).catch((e) => (isNotFound(e) ? null : Promise.reject(e))),
  ]);
  if (!customer) notFound();
  const { data: orders } = await listOrders({ search: customer.email, perPage: 10 });
  const name = `${customer.first_name} ${customer.last_name}`.trim() || customer.email;

  return (
    <>
      <PageHeader
        title={name}
        back={{ href: "/admin/customers", label: "Customers" }}
        actions={
          <form action={deleteCustomerAction}>
            <input type="hidden" name="id" value={customer.id} />
            <ConfirmButton message={`Delete ${name}'s account? They won't be able to sign in. Their past orders are kept.`}>Delete customer</ConfirmButton>
          </form>
        }
      />
      <SearchParamsNotice sp={sp} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <form action={updateCustomerAction}>
          <input type="hidden" name="id" value={customer.id} />
          <Card>
            <CustomerFields customer={customer} />
            <div className="mt-4">
              <AdminButton>Save customer</AdminButton>
            </div>
          </Card>
        </form>
        <Card title="Orders" className="h-fit">
          {orders.length === 0 ? (
            <p className="text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                    #{o.number}
                  </Link>
                  <Badge status={o.status} />
                  <span className="tabular-nums">{adminMoney(o.total, o.currency)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-muted">Customer since {adminDate(customer.date_created).split(",").slice(0, 2).join(",")}</p>
        </Card>
      </div>
    </>
  );
}
