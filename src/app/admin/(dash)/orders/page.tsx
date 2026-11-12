import type { Metadata } from "next";
import Link from "next/link";
import { adminDate, adminMoney } from "@/components/admin/format";
import { Badge, EmptyRow, inputClass, PageHeader, Pager, TableCard } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { listOrders, ORDER_STATUSES } from "@/services/admin/woo";
import { cn } from "@/utils/cn";

export const metadata: Metadata = { title: "Orders" };

const TABS = [{ value: "", label: "All" }, ...ORDER_STATUSES.filter((s) => ["processing", "on-hold", "pending", "completed", "cancelled"].includes(s.value))];

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireStaff();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && ORDER_STATUSES.some((s) => s.value === sp.status) ? sp.status : "";
  const search = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { data: orders, totalPages } = await listOrders({ page, status, search });

  const href = (params: Record<string, string | number>) => {
    const q = new URLSearchParams(Object.entries({ status, q: search, ...params }).filter(([k, v]) => v !== "" && !(k === "page" && String(v) === "1")).map(([k, v]) => [k, String(v)]));
    return `/admin/orders${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Orders" />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <nav aria-label="Filter by status" className="flex gap-1 overflow-x-auto rounded-xl bg-black/5 p-1">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={href({ status: t.value, page: 1 })}
              aria-current={status === t.value ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm whitespace-nowrap",
                status === t.value ? "bg-canvas font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form className="ml-auto w-full sm:w-64" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <label className="sr-only" htmlFor="order-search">
            Search orders
          </label>
          <input id="order-search" name="q" defaultValue={search} placeholder="Search name, email or order #" className={inputClass} />
        </form>
      </div>
      <TableCard>
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Payment</th>
            <th>Status</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && <EmptyRow cols={6}>No orders found.</EmptyRow>}
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-canvas-alt/60">
              <td>
                <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                  #{o.number}
                </Link>
              </td>
              <td className="whitespace-nowrap text-ink-muted">{adminDate(o.date_created)}</td>
              <td>
                {o.billing.first_name} {o.billing.last_name}
                <span className="block text-xs text-ink-muted">{o.billing.email}</span>
              </td>
              <td className="text-ink-muted">{o.payment_method_title}</td>
              <td>
                <Badge status={o.status} />
              </td>
              <td className="text-right whitespace-nowrap tabular-nums">{adminMoney(o.total, o.currency)}</td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pager page={page} totalPages={totalPages} href={(p) => href({ page: p })} />
    </>
  );
}
