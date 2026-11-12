"use client";

import { Tag, X } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { Cart } from "@/types/cart";
import { decodeEntities } from "@/utils/text";
import { money } from "./cart-lines";

/** Totals as calculated by WooCommerce, plus coupon and shipping controls. */
export function CartTotals({ cart, editable = true }: { cart: Cart; editable?: boolean }) {
  const t = cart.totals;
  const discount = Number.parseInt(t.total_discount, 10) > 0;
  const tax = Number.parseInt(t.total_tax, 10) > 0;

  return (
    <div className="flex flex-col gap-5">
      {editable && <CouponForm cart={cart} />}
      {cart.needs_shipping && <ShippingOptions cart={cart} editable={editable} />}

      <dl className="flex flex-col gap-2 text-body">
        <Row label="Subtotal" value={money(t.total_items, cart)} />
        {discount && <Row label="Discount" value={`−${money(t.total_discount, cart)}`} accent />}
        {cart.needs_shipping && (
          <Row
            label="Delivery"
            value={t.total_shipping === null ? "Calculated at checkout" : money(t.total_shipping, cart)}
          />
        )}
        {tax && <Row label="Tax" value={money(t.total_tax, cart)} />}
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
          <dt className="text-lg font-semibold">Total</dt>
          <dd className="text-title tabular-nums">{money(t.total_price, cart)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={accent ? "font-medium text-brand-strong tabular-nums" : "tabular-nums"}>{value}</dd>
    </div>
  );
}

function CouponForm({ cart }: { cart: Cart }) {
  const { applyCoupon, removeCoupon, pending } = useCartStore();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const id = useId();

  // Not a <form>: this control is also rendered inside the checkout form,
  // and nested forms are invalid HTML. Enter in the field submits it.
  const submit = async () => {
    if (!code.trim()) return;
    setMessage(null);
    const r = await applyCoupon(code.trim());
    if (r.ok) setCode("");
    else setMessage(r.message);
  };

  return (
    <div className="flex flex-col gap-3">
      {cart.coupons.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Applied coupons">
          {cart.coupons.map((c) => (
            <li
              key={c.code}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint py-1 pr-1 pl-3 text-caption font-medium text-brand-strong"
            >
              <Tag aria-hidden className="size-3.5" />
              {c.code.toUpperCase()} · −{money(c.totals.total_discount, cart)}
              <button
                type="button"
                onClick={() => removeCoupon(c.code)}
                disabled={pending}
                aria-label={`Remove coupon ${c.code}`}
                className="inline-flex size-6 items-center justify-center rounded-full hover:bg-white/60"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div role="group" aria-label="Coupon" className="flex gap-2">
        <label htmlFor={id} className="sr-only">
          Coupon code
        </label>
        <input
          id={id}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // don't submit an enclosing checkout form
              void submit();
            }
          }}
          placeholder="Coupon code"
          autoComplete="off"
          maxLength={50}
          aria-describedby={message ? `${id}-msg` : undefined}
          aria-invalid={!!message}
          className="h-11 min-w-0 flex-1 rounded-full bg-canvas-alt px-4 text-body outline-none focus-visible:ring-2 focus-visible:ring-brand-strong"
        />
        <Button type="button" variant="ghost" onClick={submit} disabled={pending || !code.trim()}>
          Apply
        </Button>
      </div>
      {message && (
        <p id={`${id}-msg`} role="alert" className="text-caption text-danger">
          {message}
        </p>
      )}
    </div>
  );
}

function ShippingOptions({ cart, editable }: { cart: Cart; editable: boolean }) {
  const { selectRate, pending } = useCartStore();
  const packages = cart.shipping_rates.filter((p) => p.shipping_rates.length > 0);
  if (!packages.length) {
    return <p className="text-caption text-ink-muted">Delivery options are shown once your address is entered.</p>;
  }
  return (
    <>
      {packages.map((pkg) => {
        const only = pkg.shipping_rates.length === 1;
        return (
          <fieldset key={pkg.package_id} className="flex flex-col gap-2">
            <legend className="mb-1 text-body font-semibold">Delivery</legend>
            {pkg.shipping_rates.map((rate) => (
              <label
                key={rate.rate_id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-card px-4 py-3 shadow-[inset_0_0_0_1px_var(--color-line)] has-[:checked]:shadow-[inset_0_0_0_2px_var(--color-ink)]"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`shipping-${pkg.package_id}`}
                    value={rate.rate_id}
                    checked={rate.selected}
                    disabled={!editable || pending || only}
                    onChange={() => selectRate(pkg.package_id, rate.rate_id)}
                    className="size-4 accent-[var(--color-ink)]"
                  />
                  <span>
                    {decodeEntities(rate.name)}
                    {rate.delivery_time && (
                      <span className="block text-caption text-ink-muted">{decodeEntities(rate.delivery_time)}</span>
                    )}
                  </span>
                </span>
                <span className="tabular-nums">{money(rate.price, cart)}</span>
              </label>
            ))}
          </fieldset>
        );
      })}
    </>
  );
}
