import type { Metadata } from "next";
import { createCustomerAction } from "@/app/admin/actions";
import { CustomerFields } from "@/components/admin/customer-fields";
import { AdminButton, Card, PageHeader, SearchParamsNotice } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";

export const metadata: Metadata = { title: "Add customer" };

export default async function NewCustomerPage({ searchParams }: PageProps<"/admin/customers/new">) {
  const [, sp] = await Promise.all([requireStaff(), searchParams]);
  return (
    <>
      <PageHeader title="Add customer" back={{ href: "/admin/customers", label: "Customers" }} />
      <SearchParamsNotice sp={sp} />
      <form action={createCustomerAction} className="max-w-3xl">
        <Card>
          <CustomerFields />
          <p className="mt-4 text-xs text-ink-muted">WooCommerce emails the customer a link to set their own password. You never see or choose it.</p>
          <div className="mt-4">
            <AdminButton>Create customer</AdminButton>
          </div>
        </Card>
      </form>
    </>
  );
}
