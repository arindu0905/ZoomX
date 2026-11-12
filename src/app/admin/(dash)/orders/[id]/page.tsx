import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addOrderNoteAction, updateOrderStatusAction } from "@/app/admin/actions";
import { adminDate, adminMoney } from "@/components/admin/format";
import { AdminButton, Badge, Card, inputClass, Notice, PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { getOrder, listOrderNotes, ORDER_STATUSES } from "@/services/admin/woo";
import { StoreApiError } from "@/services/woocommerce/store-api";
import { decodeEntities, htmlToText } from "@/utils/text";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  await requireStaff();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const sp = await searchParams;
  const [order, notes] = await Promise.all([
    getOrder(id).catch((e) => {
      if (e instanceof StoreApiError && e.status === 404) notFound();
      throw e;
    }),
    listOrderNotes(id).catch(() => []),
  ]);

  const addr = (a: typeof order.billing) =>
    [`${a.first_name ?? ""} ${a.last_name ?? ""}`.trim(), a.address_1, a.address_2, [a.city, a.state].filter(Boolean).join(", "), a.postcode].filter(Boolean);

  return (
    <>
      <PageHeader title={`Order #${order.number}`} back={{ href: "/admin/orders", label: "Orders" }} />
      <Notice saved={typeof sp.saved === "string" ? sp.saved : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
        <Badge status={order.status} />
        <span>{adminDate(order.date_created)}</span>
        <span>· {order.payment_method_title}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card title="Items">
            <ul className="divide-y divide-line">
              {order.line_items.map((li) => (
                <li key={li.id} className="flex justify-between gap-4 py-2.5 text-sm">
                  <span>
                    {decodeEntities(li.name)} <span className="text-ink-muted">× {li.quantity}</span>
                    {li.sku && <span className="block text-xs text-ink-muted">SKU {li.sku}</span>}
                  </span>
                  <span className="tabular-nums">{adminMoney(li.total, order.currency)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              {Number(order.discount_total) > 0 && (
                <Row label="Discount" value={`−${adminMoney(order.discount_total, order.currency)}`} />
              )}
              <Row label="Delivery" value={adminMoney(order.shipping_total, order.currency)} />
              <Row label="Total" value={adminMoney(order.total, order.currency)} strong />
            </dl>
          </Card>

          <Card title="Notes & history">
            <form action={addOrderNoteAction} className="mb-4 flex flex-col gap-2">
              <input type="hidden" name="id" value={order.id} />
              <label className="sr-only" htmlFor="note">
                Add a note
              </label>
              <textarea id="note" name="note" rows={2} required placeholder="Add a note…" className={inputClass} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="to_customer" /> Email this note to the customer
                </label>
                <AdminButton variant="secondary">Add note</AdminButton>
              </div>
            </form>
            {notes.length === 0 ? (
              <p className="text-sm text-ink-muted">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className={n.customer_note ? "rounded-xl bg-[#e3f1fd] p-3 text-sm" : "rounded-xl bg-canvas-alt p-3 text-sm"}>
                    <p>{htmlToText(n.note)}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {adminDate(n.date_created)} · {n.author || "System"}
                      {n.customer_note && " · sent to customer"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Status">
            <form action={updateOrderStatusAction} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={order.id} />
              <label className="sr-only" htmlFor="status">
                Order status
              </label>
              <select id="status" name="status" defaultValue={order.status} className={inputClass}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <AdminButton>Update status</AdminButton>
              <p className="text-xs text-ink-muted">
                Typical flow: Processing → Completed once delivered. Cancelling or refunding returns stock automatically.
              </p>
            </form>
          </Card>
          <Card title="Customer">
            <p className="text-sm">
              {order.billing.first_name} {order.billing.last_name}
            </p>
            {order.billing.email && (
              <a href={`mailto:${order.billing.email}`} className="block text-sm text-brand-strong hover:underline">
                {order.billing.email}
              </a>
            )}
            {order.billing.phone && (
              <a href={`tel:${order.billing.phone}`} className="block text-sm text-brand-strong hover:underline">
                {order.billing.phone}
              </a>
            )}
            {order.customer_id === 0 && <p className="mt-1 text-xs text-ink-muted">Guest checkout</p>}
          </Card>
          <Card title="Delivery address">
            <address className="text-sm not-italic">
              {(addr(order.shipping).length > 1 ? addr(order.shipping) : addr(order.billing)).map((l, i) => (
                <span key={i} className="block">
                  {l}
                </span>
              ))}
            </address>
            {order.customer_note && (
              <p className="mt-3 rounded-lg bg-[#fff4d6] p-2.5 text-sm">
                <span className="font-medium">Customer note:</span> {order.customer_note}
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between font-semibold" : "flex justify-between text-ink-muted"}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
