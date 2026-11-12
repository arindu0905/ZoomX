import type { Metadata } from "next";
import Link from "next/link";
import { adminDate } from "@/components/admin/format";
import { AdminLinkButton, EmptyRow, inputClass, PageHeader, Pager, SearchParamsNotice, TableCard } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { listCustomers } from "@/services/admin/woo";
/** Live per request behind the staff check; not validated for instant navigation (see ../layout.tsx). */export const instant = false;

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const [, sp] = await Promise.all([requireStaff(), searchParams]);
  const search = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { data: customers, total, totalPages } = await listCustomers({ page, search });

  return (
    <>
      <PageHeader
        title="Customers"
        actions={
          <AdminLinkButton href="/admin/customers/new" variant="primary">
            Add customer
          </AdminLinkButton>
        }
      />
      <SearchParamsNotice sp={sp} />
      <form className="mb-4 flex flex-wrap items-center gap-2" role="search">
        <label className="sr-only" htmlFor="customer-search">
          Search customers
        </label>
        <input id="customer-search" name="q" defaultValue={search} placeholder="Search name or email" className={`${inputClass} sm:w-72`} />
        <span className="ml-auto text-sm text-ink-muted">{total} customers with accounts</span>
      </form>
      <TableCard>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>City</th>
            <th>Joined</th>
            <th>
              <span className="sr-only">Orders</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && <EmptyRow cols={6}>No customers found.</EmptyRow>}
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-canvas-alt/60">
              <td>
                <Link href={`/admin/customers/${c.id}`} className="font-semibold hover:underline">
                  {`${c.first_name} ${c.last_name}`.trim() || "—"}
                </Link>
              </td>
              <td>
                <a href={`mailto:${c.email}`} className="hover:underline">
                  {c.email}
                </a>
              </td>
              <td className="text-ink-muted">{c.billing.phone || "—"}</td>
              <td className="text-ink-muted">{c.billing.city || "—"}</td>
              <td className="whitespace-nowrap text-ink-muted">{adminDate(c.date_created)}</td>
              <td>
                <Link href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="text-sm text-brand-strong hover:underline">
                  Orders
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pager
        page={page}
        totalPages={totalPages}
        href={(p) => `/admin/customers?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(p) })}`}
      />
      <p className="mt-4 text-xs text-ink-muted">Guest orders (no account) appear under Orders only.</p>
    </>
  );
}
