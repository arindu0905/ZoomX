import type { Metadata } from "next";
import Link from "next/link";
import { adminDate, adminMoney } from "@/components/admin/format";
import { Badge, Card, EmptyRow, PageHeader, TableCard } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { lowStockProducts, recentOrders } from "@/services/admin/woo";
import { decodeEntities } from "@/utils/text";

export const metadata: Metadata = { title: "Home" };

// Statuses that count as sales (paid or being fulfilled). Totals come from WooCommerce.
const SALE_STATUSES = new Set(["processing", "completed", "on-hold"]);

export default async function AdminHome() {
  const staff = await requireStaff();
  const [{ data: orders, total: orderCount }, lowStock] = await Promise.all([recentOrders(30), lowStockProducts()]);

  const sales = orders.filter((o) => SALE_STATUSES.has(o.status));
  const revenue = sales.reduce((sum, o) => sum + Number.parseFloat(o.total || "0"), 0);
  const toFulfil = orders.filter((o) => o.status === "processing").length;
  const currency = orders[0]?.currency ?? "LKR";

  return (
    <>
      <PageHeader title={`Hello, ${staff.name.split(" ")[0]}.`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders · last 30 days" value={String(orderCount)} />
        <Stat label="Sales · last 30 days" value={adminMoney(revenue, currency)} hint={orderCount > 100 ? "From the latest 100 orders" : "Processing, on hold and completed"} />
        <Stat label="Waiting to be packed" value={String(toFulfil)} href="/admin/orders?status=processing" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="recent">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="recent" className="text-sm font-semibold">
              Recent orders
            </h2>
            <Link href="/admin/orders" className="text-sm text-ink-muted hover:text-ink">
              View all
            </Link>
          </div>
          <TableCard>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && <EmptyRow cols={5}>No orders in the last 30 days.</EmptyRow>}
              {orders.slice(0, 8).map((o) => (
                <tr key={o.id} className="hover:bg-canvas-alt/60">
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                      #{o.number}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-ink-muted">{adminDate(o.date_created)}</td>
                  <td>
                    {o.billing.first_name} {o.billing.last_name}
                  </td>
                  <td>
                    <Badge status={o.status} />
                  </td>
                  <td className="text-right whitespace-nowrap tabular-nums">{adminMoney(o.total, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        </section>

        <Card title="Low stock">
          {lowStock.length === 0 ? (
            <p className="text-sm text-ink-muted">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/admin/products/${p.id}`} className="truncate hover:underline">
                    {decodeEntities(p.name)}
                  </Link>
                  {p.stock_status === "outofstock" ? (
                    <Badge status="outofstock" />
                  ) : (
                    <span className="shrink-0 tabular-nums text-ink-muted">{p.stock_quantity} left</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ink-muted">Products with options show their stock on each option.</p>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, hint, href }: { label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl bg-canvas p-5 shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-canvas-alt/60">
      {body}
    </Link>
  ) : (
    <div className="rounded-2xl bg-canvas p-5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">{body}</div>
  );
}
