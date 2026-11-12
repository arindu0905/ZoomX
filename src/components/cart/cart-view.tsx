"use client";

import { motion } from "framer-motion";
import { ArrowRight, Lock, ShoppingBag, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { CartLines, money } from "./cart-lines";
import { CartTotals } from "./cart-totals";

const ease = [0.22, 1, 0.36, 1] as const;

export function CartView() {
  const { cart, status } = useCartStore();

  if (status === "error" && !cart) {
    return (
      <p role="alert" className="rounded-card bg-canvas-alt px-6 py-16 text-center text-body text-ink-muted">
        We couldn’t load your bag. Please refresh the page.
      </p>
    );
  }
  if (!cart) return <CartSkeleton />;
  if (cart.items_count === 0) return <EmptyBag />;

  return (
    <>
      <div className="grid gap-10 pb-24 lg:grid-cols-[1.4fr_1fr] lg:gap-12 lg:pb-0">
        <motion.section
          aria-labelledby="bag-items"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
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
        </motion.section>
        <motion.aside
          aria-labelledby="summary-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease }}
          className="h-fit rounded-card bg-canvas-alt p-5 sm:p-8 lg:sticky lg:top-24"
        >
          <h2 id="summary-title" className="mb-6 text-title">
            Summary
          </h2>
          <CartTotals cart={cart} />
          <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
            <Lock aria-hidden className="size-4" />
            Check out
          </ButtonLink>
        </motion.aside>
      </div>

      {/* Phones: total + Check out always within thumb reach. */}
      <motion.div
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32, delay: 0.3 }}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 px-gutter pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
      >
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-caption text-ink-muted">
              Total · {cart.items_count} {cart.items_count === 1 ? "item" : "items"}
            </p>
            <p className="text-lg font-semibold tabular-nums">{money(cart.totals.total_price, cart)}</p>
          </div>
          <ButtonLink href="/checkout">
            Check out
            <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
        </div>
      </motion.div>
    </>
  );
}

function EmptyBag() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease }}
      className="relative flex flex-col items-center gap-5 overflow-hidden rounded-card bg-canvas-alt px-6 py-20 text-center"
    >
      <span aria-hidden className="pointer-events-none absolute -top-16 left-1/2 size-64 -translate-x-1/2 rounded-full bg-brand-tint blur-3xl" />
      <motion.span
        aria-hidden
        className="relative flex size-20 items-center justify-center rounded-full bg-canvas shadow-card"
        animate={{ y: [0, -8, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ShoppingBag className="size-9 text-brand-strong" strokeWidth={1.4} />
        <Sparkles className="absolute -top-1 -right-1 size-5 text-highlight" />
      </motion.span>
      <h2 className="relative text-title">Your bag is empty.</h2>
      <p className="relative max-w-sm text-body text-pretty text-ink-muted">
        Fresh dishes, soft laundry, sparkling glass — the whole ZOOM X range is a tap away.
      </p>
      <ButtonLink href="/shop" size="lg" className="relative">
        Shop the range
        <ArrowRight aria-hidden className="size-4" />
      </ButtonLink>
    </motion.div>
  );
}

function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your bag" className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4 py-4">
            <div className="shimmer size-20 shrink-0 rounded-[12%]" />
            <div className="flex flex-1 flex-col gap-2.5 pt-1">
              <div className="shimmer h-4 w-2/3 rounded-full" />
              <div className="shimmer h-4 w-1/3 rounded-full" />
              <div className="shimmer mt-2 h-9 w-28 rounded-button" />
            </div>
          </div>
        ))}
      </div>
      <div className="shimmer h-72 rounded-card" />
    </div>
  );
}
