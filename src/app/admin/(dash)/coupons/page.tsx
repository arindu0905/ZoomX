import type { Metadata } from "next";
import { createCouponAction, deleteCouponAction } from "@/app/admin/actions";
import { adminDate, adminMoney } from "@/components/admin/format";
import { AdminButton, Card, EmptyRow, Field, inputClass, Notice, PageHeader, TableCard } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { listCoupons } from "@/services/admin/woo";

export const metadata: Metadata = { title: "Discounts" };

export default async function CouponsPage({ searchParams }: PageProps<"/admin/coupons">) {
  await requireStaff();
  const sp = await searchParams;
  const coupons = await listCoupons();

  return (
    <>
      <PageHeader title="Discounts" />
      <Notice saved={typeof sp.saved === "string" ? sp.saved : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <TableCard>
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Used</th>
              <th>Expires</th>
              <th>
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 && <EmptyRow cols={5}>No discount codes yet.</EmptyRow>}
            {coupons.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="font-mono font-semibold uppercase">{c.code}</span>
                  {c.description && <span className="block text-xs text-ink-muted">{c.description}</span>}
                </td>
                <td className="whitespace-nowrap">
                  {c.discount_type === "percent" ? `${Number(c.amount)}% off` : `${adminMoney(c.amount)} off`}
                  {Number(c.minimum_amount) > 0 && <span className="block text-xs text-ink-muted">Min. {adminMoney(c.minimum_amount)}</span>}
                </td>
                <td className="tabular-nums text-ink-muted">
                  {c.usage_count}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </td>
                <td className="whitespace-nowrap text-ink-muted">{c.date_expires ? adminDate(c.date_expires).split(",")[0] : "Never"}</td>
                <td className="text-right">
                  <form action={deleteCouponAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <AdminButton variant="danger" aria-label={`Delete ${c.code}`}>
                      Delete
                    </AdminButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>

        <Card title="Create a discount code">
          <form action={createCouponAction} className="flex flex-col gap-3">
            <Field label="Code" hint="Customers type this in the bag. Letters, numbers, - and _.">
              <input name="code" required minLength={3} maxLength={40} pattern="[A-Za-z0-9_\-]+" className={`${inputClass} font-mono uppercase`} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select name="discount_type" className={inputClass}>
                  <option value="percent">% off</option>
                  <option value="fixed_cart">LKR off</option>
                </select>
              </Field>
              <Field label="Amount">
                <input name="amount" required inputMode="decimal" className={inputClass} />
              </Field>
            </div>
            <Field label="Minimum spend (LKR)" hint="Optional.">
              <input name="minimum_amount" inputMode="decimal" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expires" hint="Optional.">
                <input name="date_expires" type="date" className={inputClass} />
              </Field>
              <Field label="Max uses" hint="Optional.">
                <input name="usage_limit" inputMode="numeric" className={inputClass} />
              </Field>
            </div>
            <Field label="Internal note" hint="Optional, not shown to customers.">
              <input name="description" maxLength={200} className={inputClass} />
            </Field>
            <AdminButton>Create code</AdminButton>
          </form>
        </Card>
      </div>
    </>
  );
}
