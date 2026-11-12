"use client";

import { motion } from "framer-motion";
import { PartyPopper, Truck } from "lucide-react";
import type { Cart } from "@/types/cart";
import { money } from "./cart-lines";

/**
 * Free-delivery threshold in LKR, from NEXT_PUBLIC_FREE_DELIVERY_FROM.
 * Must match the "Free shipping" minimum configured in WooCommerce
 * (WooCommerce → Settings → Shipping); the bar is hidden when unset, so the
 * storefront never promises an offer the store doesn't apply.
 */
const THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_DELIVERY_FROM ?? "");

export function FreeDeliveryBar({ cart }: { cart: Cart }) {
  if (!Number.isFinite(THRESHOLD) || THRESHOLD <= 0 || !cart.needs_shipping) return null;
  const unit = 10 ** cart.totals.currency_minor_unit;
  const target = Math.round(THRESHOLD * unit);
  const spent = Number.parseInt(cart.totals.total_items, 10) || 0;
  const left = Math.max(0, target - spent);
  const pct = Math.min(100, (spent / target) * 100);
  const done = left === 0;

  return (
    <div className="rounded-button bg-brand-tint/60 p-3" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-caption font-medium text-ink">
        {done ? (
          <PartyPopper aria-hidden className="size-4 text-brand-strong" />
        ) : (
          <Truck aria-hidden className="size-4 text-brand-strong" />
        )}
        {done ? "You’ve unlocked free delivery!" : <>Add {money(String(left), cart)} more for free delivery</>}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <motion.div
          className="h-full rounded-full bg-brand-strong"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
