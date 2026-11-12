import type { Metadata } from "next";
import { createOrderAction } from "@/app/admin/actions";
import { AddressFields } from "@/components/admin/address-fields";
import { adminMoney } from "@/components/admin/format";
import { AdminButton, Card, Field, inputClass, PageHeader, SearchParamsNotice } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { listAllProducts, listVariations, ORDER_STATUSES } from "@/services/admin/woo";
import { decodeEntities } from "@/utils/text";

export const metadata: Metadata = { title: "Create order" };

const ROWS = 5;

/** Manual order (phone / WhatsApp / walk-in). WooCommerce prices the items, totals the order and reduces stock. */
export default async function NewOrderPage({ searchParams }: PageProps<"/admin/orders/new">) {
  const [, sp, products] = await Promise.all([requireStaff(), searchParams, listAllProducts()]);
  // Expand products with options into one choice per option.
  const choices = (
    await Promise.all(
      products.map(async (p) => {
        const name = decodeEntities(p.name);
        if (p.type !== "variable") return [{ value: String(p.id), label: `${name} — ${p.price ? adminMoney(p.price) : "no price"}${p.stock_status === "outofstock" ? " (out of stock)" : ""}` }];
        const vs = await listVariations(p.id);
        return vs.map((v) => ({
          value: `${p.id}:${v.id}`,
          label: `${name} · ${v.attributes.map((a) => a.option).join(" · ")} — ${v.price ? adminMoney(v.price) : "no price"}${v.stock_status === "outofstock" ? " (out of stock)" : ""}`,
        }));
      }),
    )
  ).flat();

  return (
    <>
      <PageHeader title="Create order" back={{ href: "/admin/orders", label: "Orders" }} />
      <p className="-mt-3 mb-5 text-sm text-ink-muted">For phone, WhatsApp or walk-in orders. WooCommerce sets the prices, works out the total and reduces stock.</p>
      <SearchParamsNotice sp={sp} />
      <form action={createOrderAction} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card title="Products">
            <div className="flex flex-col gap-3">
              {Array.from({ length: ROWS }, (_, i) => (
                <div key={i} className="grid grid-cols-[1fr_5rem] gap-2">
                  <label className="sr-only" htmlFor={`item-${i}`}>
                    Product {i + 1}
                  </label>
                  <select id={`item-${i}`} name="item" defaultValue="" className={inputClass}>
                    <option value="">{i === 0 ? "Choose a product…" : "— (optional)"}</option>
                    {choices.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor={`qty-${i}`}>
                    Quantity {i + 1}
                  </label>
                  <input id={`qty-${i}`} name="qty" type="number" min={0} max={999} defaultValue={i === 0 ? 1 : 0} className={inputClass} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Customer and delivery address">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" hint="Optional. Needed for order emails.">
                  <input name="email" type="email" maxLength={200} className={inputClass} />
                </Field>
                <Field label="Phone">
                  <input name="phone" type="tel" maxLength={20} className={inputClass} />
                </Field>
              </div>
              <AddressFields />
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Order">
            <div className="flex flex-col gap-4">
              <Field label="Status">
                <select name="status" defaultValue="processing" className={inputClass}>
                  {ORDER_STATUSES.filter((s) => ["pending", "processing", "on-hold", "completed"].includes(s.value)).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Payment">
                <select name="payment" defaultValue="Cash on delivery" className={inputClass}>
                  <option>Cash on delivery</option>
                  <option>Bank transfer</option>
                  <option>Paid in store</option>
                </select>
              </Field>
              <Field label="Delivery charge (LKR)" hint="Optional. Leave empty for none.">
                <input name="delivery" inputMode="decimal" className={inputClass} />
              </Field>
              <Field label="Note from the customer">
                <textarea name="note" rows={2} maxLength={1000} className={inputClass} />
              </Field>
              <AdminButton>Create order</AdminButton>
            </div>
          </Card>
        </div>
      </form>
    </>
  );
}
