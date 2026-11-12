import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addOrderNoteAction, deleteOrderNoteAction, saveOrderDetailsAction, trashOrderAction, updateOrderStatusAction } from "@/app/admin/actions";
import { AddressFields } from "@/components/admin/address-fields";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { adminDate, adminMoney } from "@/components/admin/format";
import { AdminButton, Badge, Card, Field, inputClass, isNotFound, PageHeader, SearchParamsNotice } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { getOrder, listOrderNotes, ORDER_STATUSES } from "@/services/admin/woo";
import { decodeEntities, htmlToText } from "@/utils/text";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [, sp, order, notes] = await Promise.all([
    requireStaff(),
    searchParams,
    getOrder(id).catch((e) => (isNotFound(e) ? null : Promise.reject(e))),
    listOrderNotes(id).catch(() => []),
  ]);
  if (!order) notFound();
  const delivery = order.shipping.address_1 ? order.shipping : order.billing;

  return (
    <>
      <PageHeader
        title={`Order #${order.number}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        actions={
          <form action={trashOrderAction}>
            <input type="hidden" name="id" value={order.id} />
            <ConfirmButton message={`Delete order #${order.number}? It moves to the trash (restorable in WooCommerce for 30 days). Stock is not returned automatically — cancel the order first if the goods weren’t sent.`}>
              Delete order
            </ConfirmButton>
          </form>
        }
      />
      <SearchParamsNotice sp={sp} />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
        <Badge status={order.status} />
        <span>{adminDate(order.date_created)}</span>
        <span>· {order.payment_method_title || "—"}</span>
        {order.created_via === "rest-api" && <span>· Created in the dashboard</span>}
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
              {Number(order.discount_total) > 0 && <Row label="Discount" value={`−${adminMoney(order.discount_total, order.currency)}`} />}
              <Row label="Delivery" value={adminMoney(order.shipping_total, order.currency)} />
              <Row label="Total" value={adminMoney(order.total, order.currency)} strong />
            </dl>
          </Card>

          <Card title="Customer and delivery details">
            <form action={saveOrderDetailsAction} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={order.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input name="email" type="email" defaultValue={order.billing.email ?? ""} maxLength={200} className={inputClass} />
                </Field>
                <Field label="Phone">
                  <input name="phone" type="tel" defaultValue={order.billing.phone ?? ""} maxLength={20} className={inputClass} />
                </Field>
              </div>
              <AddressFields value={{ ...delivery, first_name: order.billing.first_name || delivery.first_name, last_name: order.billing.last_name || delivery.last_name }} />
              <Field label="Note from the customer">
                <textarea name="customer_note" rows={2} defaultValue={order.customer_note} maxLength={1000} className={inputClass} />
              </Field>
              <div>
                <AdminButton variant="secondary">Save details</AdminButton>
              </div>
            </form>
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
                  <li key={n.id} className={(n.customer_note ? "bg-[#e3f1fd]" : "bg-canvas-alt") + " flex items-start justify-between gap-3 rounded-xl p-3 text-sm"}>
                    <div>
                      <p>{htmlToText(n.note)}</p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {adminDate(n.date_created)} · {n.author || "System"}
                        {n.customer_note && " · sent to customer"}
                      </p>
                    </div>
                    <form action={deleteOrderNoteAction}>
                      <input type="hidden" name="order_id" value={order.id} />
                      <input type="hidden" name="id" value={n.id} />
                      <ConfirmButton message="Delete this note?" className="min-h-7 px-2 text-xs" aria-label="Delete note">
                        Delete
                      </ConfirmButton>
                    </form>
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
              <p className="text-xs text-ink-muted">Typical flow: Processing → Completed once delivered. Cancelling or refunding returns stock automatically.</p>
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
            <p className="mt-1 text-xs text-ink-muted">{order.customer_id === 0 ? "Guest" : "Has an account"}</p>
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
