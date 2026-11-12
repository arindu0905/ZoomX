import type { Metadata } from "next";
import Link from "next/link";
import { createCouponAction, deleteCouponAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CouponFields } from "@/components/admin/coupon-fields";
import { adminDate, adminMoney } from "@/components/admin/format";
import { AdminButton, Card, EmptyRow, PageHeader, SearchParamsNotice, TableCard } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { listCoupons } from "@/services/admin/woo";
/** Live per request behind the staff check; not validated for instant navigation (see ../layout.tsx). */export const instant = false;

export const metadata: Metadata = { title: "Discounts" };

export default async function CouponsPage({ searchParams }: PageProps<"/admin/coupons">) {
  const [, sp, coupons] = await Promise.all([requireStaff(), searchParams, listCoupons()]);
  return (
    <>
      <PageHeader title="Discounts" />
      <SearchParamsNotice sp={sp} />
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
              <tr key={c.id} className="hover:bg-canvas-alt/60">
                <td>
                  <Link href={`/admin/coupons/${c.id}`} className="font-mono font-semibold uppercase hover:underline">
                    {c.code}
                  </Link>
                  {c.description && <span className="block text-xs text-ink-muted">{c.description}</span>}
                </td>
                <td className="whitespace-nowrap">
                  {c.discount_type === "percent" ? `${Number(c.amount)}% off` : `${adminMoney(c.amount)} off`}
                  {c.free_shipping && <span className="block text-xs text-ink-muted">+ free delivery</span>}
                  {Number(c.minimum_amount) > 0 && <span className="block text-xs text-ink-muted">Min. {adminMoney(c.minimum_amount)}</span>}
                </td>
                <td className="tabular-nums text-ink-muted">
                  {c.usage_count}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </td>
                <td className="whitespace-nowrap text-ink-muted">
                  {c.date_expires ? adminDate(c.date_expires).split(",").slice(0, 2).join(",") : "Never"}
                </td>
                <td className="text-right">
                  <form action={deleteCouponAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmButton message={`Delete the code ${c.code.toUpperCase()}?`} aria-label={`Delete ${c.code}`}>
                      Delete
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
        <Card title="Create a discount code" className="h-fit">
          <form action={createCouponAction} className="flex flex-col gap-3">
            <CouponFields />
            <AdminButton>Create code</AdminButton>
          </form>
        </Card>
      </div>
    </>
  );
}
