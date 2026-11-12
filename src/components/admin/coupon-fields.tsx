import type { AdminCoupon } from "@/services/admin/woo";
import { Field, inputClass } from "./ui";

/** Discount code fields (names match readCoupon() in actions.ts). */
export function CouponFields({ coupon }: { coupon?: AdminCoupon }) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Code" hint="Customers type this in the bag. Letters, numbers, - and _.">
        <input
          name="code"
          defaultValue={coupon?.code.toUpperCase() ?? ""}
          required
          minLength={3}
          maxLength={40}
          pattern="[A-Za-z0-9_\-]+"
          className={`${inputClass} font-mono uppercase`}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select name="discount_type" defaultValue={coupon?.discount_type === "fixed_cart" ? "fixed_cart" : "percent"} className={inputClass}>
            <option value="percent">% off</option>
            <option value="fixed_cart">LKR off</option>
          </select>
        </Field>
        <Field label="Amount">
          <input name="amount" required inputMode="decimal" defaultValue={coupon ? String(Number(coupon.amount)) : ""} className={inputClass} />
        </Field>
      </div>
      <Field label="Minimum spend (LKR)" hint="Optional.">
        <input
          name="minimum_amount"
          inputMode="decimal"
          defaultValue={coupon && Number(coupon.minimum_amount) > 0 ? coupon.minimum_amount : ""}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expires" hint="Optional.">
          <input name="date_expires" type="date" defaultValue={coupon?.date_expires?.slice(0, 10) ?? ""} className={inputClass} />
        </Field>
        <Field label="Max uses" hint="Optional.">
          <input name="usage_limit" inputMode="numeric" defaultValue={coupon?.usage_limit ?? ""} className={inputClass} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="free_shipping" defaultChecked={coupon?.free_shipping ?? false} /> Also gives free delivery
      </label>
      <Field label="Internal note" hint="Optional, not shown to customers.">
        <input name="description" defaultValue={coupon?.description ?? ""} maxLength={200} className={inputClass} />
      </Field>
    </div>
  );
}
