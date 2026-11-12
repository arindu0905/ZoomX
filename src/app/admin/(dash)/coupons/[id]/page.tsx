import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteCouponAction, updateCouponAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CouponFields } from "@/components/admin/coupon-fields";
import { AdminButton, Card, isNotFound, PageHeader, SearchParamsNotice } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { getCoupon } from "@/services/admin/woo";
/** Live per request behind the staff check; not validated for instant navigation (see ../layout.tsx). */export const instant = false;

export const metadata: Metadata = { title: "Edit discount" };

export default async function EditCouponPage({ params, searchParams }: PageProps<"/admin/coupons/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [, sp, coupon] = await Promise.all([
    requireStaff(),
    searchParams,
    getCoupon(id).catch((e) => (isNotFound(e) ? null : Promise.reject(e))),
  ]);
  if (!coupon) notFound();
  const code = coupon.code.toUpperCase();
  return (
    <>
      <PageHeader
        title={code}
        back={{ href: "/admin/coupons", label: "Discounts" }}
        actions={
          <form action={deleteCouponAction}>
            <input type="hidden" name="id" value={coupon.id} />
            <ConfirmButton message={`Delete the code ${code}?`}>Delete code</ConfirmButton>
          </form>
        }
      />
      <SearchParamsNotice sp={sp} />
      <form action={updateCouponAction} className="max-w-lg">
        <input type="hidden" name="id" value={coupon.id} />
        <Card>
          <CouponFields coupon={coupon} />
          <p className="mt-3 text-xs text-ink-muted">Used {coupon.usage_count} times so far.</p>
          <div className="mt-4">
            <AdminButton>Save code</AdminButton>
          </div>
        </Card>
      </form>
    </>
  );
}
