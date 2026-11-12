"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { productHref } from "@/components/products/product-card";
import { useCartStore } from "@/store/cart";
import type { Cart, CartItem } from "@/types/cart";
import { formatPrice } from "@/utils/currency";
import { cn } from "@/utils/cn";
import { decodeEntities } from "@/utils/text";

export const money = (amount: string, cart: Pick<Cart, "totals">) =>
  formatPrice({ amount, minorUnit: cart.totals.currency_minor_unit, currencyCode: cart.totals.currency_code });

const slugFromPermalink = (permalink?: string) => permalink?.match(/\/product\/([^/]+)\/?$/)?.[1];

export function CartLines({ cart, compact = false }: { cart: Cart; compact?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {cart.items.map((item) => (
        <CartLine key={item.key} item={item} cart={cart} compact={compact} />
      ))}
    </ul>
  );
}

function CartLine({ item, cart, compact }: { item: CartItem; cart: Cart; compact: boolean }) {
  const { update, remove, pending } = useCartStore();
  const [error, setError] = useState<string | null>(null);
  const name = decodeEntities(item.name);
  const slug = slugFromPermalink(item.permalink);
  const limits = item.quantity_limits ?? {};
  const min = limits.minimum ?? 1;
  const max = limits.maximum ?? 99;
  const step = limits.multiple_of ?? 1;
  const editable = limits.editable !== false;
  const image = item.images[0];

  const run = async (p: Promise<{ ok: boolean; message?: string }>) => {
    setError(null);
    const r = await p;
    if (!r.ok) setError(r.message ?? "Couldn’t update this item.");
  };

  return (
    <li className="flex gap-4 py-5">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-card bg-canvas-alt",
          compact ? "size-20" : "size-24 sm:size-28",
        )}
      >
        {image && <Image src={image.thumbnail ?? image.src} alt="" fill sizes="112px" className="object-contain p-2" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">
              {slug ? (
                <Link href={productHref(slug)} className="hover:underline underline-offset-4">
                  {name}
                </Link>
              ) : (
                name
              )}
            </p>
            {item.variation.length > 0 && (
              <p className="text-caption text-ink-muted">
                {item.variation.map((v) => `${decodeEntities(v.attribute)}: ${decodeEntities(v.value)}`).join(" · ")}
              </p>
            )}
            {item.low_stock_remaining ? (
              <p className="text-caption text-danger">Only {item.low_stock_remaining} left</p>
            ) : null}
          </div>
          <p className="shrink-0 text-right font-semibold tabular-nums">
            <span className="sr-only">Line total </span>
            {money(item.totals.line_subtotal, cart)}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          {editable ? (
            <div
              className="flex items-center rounded-full bg-canvas-alt"
              role="group"
              aria-label={`Quantity for ${name}`}
            >
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-[#e8e8ed] disabled:opacity-30"
                aria-label="Decrease quantity"
                disabled={pending || item.quantity - step < min}
                onClick={() => run(update(item.key, item.quantity - step))}
              >
                <Minus aria-hidden className="size-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                {item.quantity}
              </span>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-[#e8e8ed] disabled:opacity-30"
                aria-label="Increase quantity"
                disabled={pending || item.quantity + step > max}
                onClick={() => run(update(item.key, item.quantity + step))}
              >
                <Plus aria-hidden className="size-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-caption text-ink-muted">Qty {item.quantity}</span>
          )}
          <button
            type="button"
            onClick={() => run(remove(item.key))}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-caption text-ink-muted hover:text-ink disabled:opacity-40"
          >
            <Trash2 aria-hidden className="size-3.5" />
            Remove<span className="sr-only"> {name}</span>
          </button>
        </div>
        {error && (
          <p role="alert" className="text-caption text-danger">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}
