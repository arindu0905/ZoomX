"use client";

import { ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { CartLines } from "./cart-lines";
import { CartTotals } from "./cart-totals";

export function CartView() {
  const { cart, status } = useCartStore();

  if (status === "error" && !cart) {
    return (
      <p role="alert" className="rounded-card bg-canvas-alt px-6 py-16 text-center text-body text-ink-muted">
        We couldn’t load your bag. Please refresh the page.
      </p>
    );
  }
  if (!cart) {
    return <p className="py-16 text-center text-body text-ink-muted">Loading your bag…</p>;
  }
  if (cart.items_count === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-card bg-canvas-alt px-6 py-20 text-center">
        <ShoppingBag aria-hidden className="size-10 text-ink-muted" strokeWidth={1.25} />
        <h2 className="text-title">Your bag is empty.</h2>
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
      <section aria-labelledby="bag-items">
        <h2 id="bag-items" className="sr-only">
          Items
        </h2>
        {cart.errors.length > 0 && (
          <ul role="alert" className="mb-4 rounded-card bg-[#fdecec] px-5 py-4 text-body text-danger">
            {cart.errors.map((e) => (
              <li key={e.code}>{e.message}</li>
            ))}
          </ul>
        )}
        <CartLines cart={cart} />
        <ButtonLink href="/shop" variant="link" className="mt-6 text-body">
          Continue shopping
        </ButtonLink>
      </section>
      <aside aria-labelledby="summary-title" className="h-fit rounded-card bg-canvas-alt p-6 sm:p-8 lg:sticky lg:top-24">
        <h2 id="summary-title" className="mb-6 text-title">
          Summary
        </h2>
        <CartTotals cart={cart} />
        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
          Check out
        </ButtonLink>
      </aside>
    </div>
  );
}
