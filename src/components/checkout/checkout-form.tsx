"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch, type FieldErrors, type Resolver, type UseFormRegister } from "react-hook-form";
import { CartLines, money } from "@/components/cart/cart-lines";
import { CartTotals } from "@/components/cart/cart-totals";
import { Button, ButtonLink } from "@/components/ui/button";
import type { ApiErrorBody } from "@/lib/api-route";
import { checkoutSchema, type CheckoutData, type CheckoutInput } from "@/lib/checkout-schema";
import { PAYMENT_METHODS, type PaymentMethodId } from "@/lib/payment-methods";
import { DISTRICTS } from "@/lib/sri-lanka";
import { useCartStore } from "@/store/cart";
import { SelectField, TextAreaField, TextField } from "./fields";

type Prefix = "billing" | "shipping";

/**
 * Checkout. Validated in the browser for fast feedback and again on the
 * server. Totals shown are WooCommerce's; the order is created from the
 * session cart by WooCommerce, not from anything on this page.
 */
export function CheckoutForm({ configuredMethods }: { configuredMethods: PaymentMethodId[] }) {
  const router = useRouter();
  const { cart, status, reset } = useCartStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Offered only if configured on the storefront AND enabled in WooCommerce.
  const methods = configuredMethods.filter((m) => cart?.payment_methods.includes(m));
  const form = useForm<CheckoutInput, unknown, CheckoutData>({
    resolver: zodResolver(checkoutSchema) as Resolver<CheckoutInput, unknown, CheckoutData>,
    mode: "onTouched",
    defaultValues: { shipToDifferentAddress: false, paymentMethod: methods[0] ?? "", note: "" },
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const shipElsewhere = useWatch({ control, name: "shipToDifferentAddress" });
  const selectedMethod = useWatch({ control, name: "paymentMethod" });
  const firstMethod = methods[0];

  // The cart (and so the enabled methods) loads after mount: preselect the first.
  useEffect(() => {
    if (firstMethod && !selectedMethod) form.setValue("paymentMethod", firstMethod);
  }, [firstMethod, selectedMethod, form]);

  if (status === "error" && !cart) {
    return (
      <p role="alert" className="py-16 text-center text-body text-ink-muted">
        We couldn’t load your bag. Please refresh the page.
      </p>
    );
  }
  if (!cart) return <p className="py-16 text-center text-body text-ink-muted">Loading checkout…</p>;
  if (cart.items_count === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-canvas-alt px-6 py-20 text-center">
        <h2 className="text-title">Your bag is empty.</h2>
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
      </div>
    );
  }

  const onSubmit = async (data: CheckoutData) => {
    setSubmitError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => null)) as ({ next?: string } & Partial<ApiErrorBody>) | null;
      if (!res.ok || !json?.next) {
        setSubmitError(json?.error?.message ?? "We couldn’t place your order. Please try again.");
        // Prices or stock may have changed — show WooCommerce's current cart.
        void useCartStore.getState().load();
        return;
      }
      reset();
      router.push(json.next);
    } catch {
      setSubmitError("You appear to be offline. Please check your connection and try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-10">
        <Section title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              hint="For your order confirmation."
              {...register("email")}
            />
            <TextField
              label="Phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="077 123 4567"
              error={errors.phone?.message}
              hint="So the courier can reach you."
              {...register("phone")}
            />
          </div>
        </Section>

        <Section title="Address">
          <AddressFields prefix="billing" register={register} errors={errors} />
          <label className="mt-2 flex items-center gap-3 text-body">
            <input
              type="checkbox"
              className="size-4 accent-[var(--color-ink)]"
              {...register("shipToDifferentAddress")}
            />
            Deliver to a different address
          </label>
        </Section>

        {shipElsewhere && (
          <Section title="Delivery address">
            <AddressFields prefix="shipping" register={register} errors={errors} />
          </Section>
        )}

        <Section title="Order notes">
          <TextAreaField
            label="Delivery instructions"
            optional
            maxLength={500}
            placeholder="Landmarks, gate code, best time to deliver…"
            error={errors.note?.message}
            {...register("note")}
          />
        </Section>

        <Section title="Payment">
          {methods.length === 0 ? (
            <p role="alert" className="text-body text-danger">
              No payment method is available right now. Please contact us to place your order.
            </p>
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Payment method</legend>
              {methods.map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer gap-3 rounded-2xl px-4 py-4 shadow-[inset_0_0_0_1px_var(--color-line)] has-[:checked]:shadow-[inset_0_0_0_2px_var(--color-ink)]"
                >
                  <input
                    type="radio"
                    value={m}
                    className="mt-1 size-4 accent-[var(--color-ink)]"
                    {...register("paymentMethod")}
                  />
                  <span>
                    <span className="block font-medium">{PAYMENT_METHODS[m].label}</span>
                    <span className="text-caption text-ink-muted">{PAYMENT_METHODS[m].description}</span>
                  </span>
                </label>
              ))}
              {errors.paymentMethod && <p className="text-caption text-danger">{errors.paymentMethod.message}</p>}
            </fieldset>
          )}
        </Section>
      </div>

      <aside aria-labelledby="order-summary" className="h-fit rounded-3xl bg-canvas-alt p-6 sm:p-8 lg:sticky lg:top-24">
        <h2 id="order-summary" className="text-title">
          Order summary
        </h2>
        <CartLines cart={cart} compact />
        <div className="mt-4">
          <CartTotals cart={cart} />
        </div>

        <label className="mt-6 flex items-start gap-3 text-body">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--color-ink)]"
            aria-invalid={!!errors.terms}
            aria-describedby={errors.terms ? "terms-error" : undefined}
            {...register("terms")}
          />
          <span>
            I have read and agree to the{" "}
            <Link href="/policies/terms" target="_blank" className="text-brand-strong underline underline-offset-4">
              terms and conditions
            </Link>
            .
          </span>
        </label>
        {errors.terms && (
          <p id="terms-error" className="mt-1 text-caption text-danger">
            {errors.terms.message}
          </p>
        )}

        {submitError && (
          <p role="alert" className="mt-4 rounded-2xl bg-[#fdecec] px-4 py-3 text-body text-danger">
            {submitError}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting || methods.length === 0}>
          <Lock aria-hidden className="size-4" />
          {isSubmitting
            ? "Placing order…"
            : selectedMethod === "zoomx_payhere"
              ? `Continue to payment · ${money(cart.totals.total_price, cart)}`
              : `Place order · ${money(cart.totals.total_price, cart)}`}
        </Button>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function AddressFields({
  prefix,
  register,
  errors,
}: {
  prefix: Prefix;
  register: UseFormRegister<CheckoutInput>;
  errors: FieldErrors<CheckoutInput>;
}) {
  const e = (errors[prefix] ?? {}) as Partial<Record<string, { message?: string }>>;
  const ac = prefix === "billing" ? "billing" : "shipping";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="First name"
        autoComplete={`${ac} given-name`}
        error={e.firstName?.message}
        {...register(`${prefix}.firstName`)}
      />
      <TextField
        label="Last name"
        autoComplete={`${ac} family-name`}
        error={e.lastName?.message}
        {...register(`${prefix}.lastName`)}
      />
      <TextField
        label="Address"
        autoComplete={`${ac} address-line1`}
        placeholder="House number and street"
        className="sm:col-span-2"
        error={e.address1?.message}
        {...register(`${prefix}.address1`)}
      />
      <TextField
        label="Apartment, suite, etc."
        optional
        autoComplete={`${ac} address-line2`}
        className="sm:col-span-2"
        error={e.address2?.message}
        {...register(`${prefix}.address2`)}
      />
      <TextField
        label="City / town"
        autoComplete={`${ac} address-level2`}
        error={e.city?.message}
        {...register(`${prefix}.city`)}
      />
      <SelectField label="District" defaultValue="" error={e.district?.message} {...register(`${prefix}.district`)}>
        <option value="" disabled>
          Choose…
        </option>
        {DISTRICTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Postal code"
        inputMode="numeric"
        autoComplete={`${ac} postal-code`}
        maxLength={5}
        error={e.postcode?.message}
        {...register(`${prefix}.postcode`)}
      />
    </div>
  );
}
