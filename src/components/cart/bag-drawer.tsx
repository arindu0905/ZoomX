"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { iconButton } from "@/components/layout/header-shared";
import { ButtonLink } from "@/components/ui/button";
import { useDialog } from "@/hooks/use-dialog";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { CartLines, money } from "./cart-lines";

/** Slide-in cart drawer. Opens after "Add to cart" and from the header icon. */
export function BagDrawer() {
  const open = useUiStore((s) => s.panel === "bag");
  const close = useUiStore((s) => s.close);
  const { cart, status } = useCartStore();
  const ref = useDialog<HTMLDivElement>(open, close);
  const empty = !cart || cart.items_count === 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bag-scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-sm"
          />
          <motion.div
            key="bag"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bag-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%", transition: { duration: 0.25 } }}
            transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-canvas shadow-[-24px_0_48px_-24px_rgba(0,0,0,0.25)]"
          >
            <header className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 id="bag-title" className="text-title">
                Your cart
                {!empty && <span className="ml-2 text-body font-normal text-ink-muted">({cart.items_count})</span>}
              </h2>
              <button type="button" onClick={close} aria-label="Close cart" className={iconButton}>
                <X aria-hidden className="size-5" strokeWidth={1.75} />
              </button>
            </header>

            {status === "loading" && !cart ? (
              <p className="px-6 text-body text-ink-muted">Loading your cart…</p>
            ) : empty ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <ShoppingBag aria-hidden className="size-10 text-ink-muted" strokeWidth={1.25} />
                <p className="text-lead">Your cart is empty.</p>
                <ButtonLink href="/shop" onClick={close} variant="secondary">
                  Continue shopping
                </ButtonLink>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  <CartLines cart={cart} compact />
                </div>
                <footer className="flex flex-col gap-3 border-t border-line px-6 pt-4 pb-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-body text-ink-muted">Subtotal</span>
                    <span className="text-lg font-semibold tabular-nums">{money(cart.totals.total_items, cart)}</span>
                  </div>
                  <p className="text-caption text-ink-muted">Delivery and discounts are calculated at checkout.</p>
                  <ButtonLink href="/checkout" onClick={close} size="lg" className="w-full">
                    Check out
                  </ButtonLink>
                  <ButtonLink href="/cart" onClick={close} variant="ghost" className="w-full">
                    View cart
                  </ButtonLink>
                </footer>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
