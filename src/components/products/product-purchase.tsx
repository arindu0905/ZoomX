"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { findVariant, isOptionAvailable, optionExists, type Selection } from "@/lib/variations";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import type { StorePrices } from "@/types/store-api";
import { cn } from "@/utils/cn";
import { Price } from "./price";

export interface PurchaseAttribute {
  name: string;
  terms: { name: string; slug: string }[];
}

export interface PurchaseVariant {
  id: number;
  attributes: Record<string, string>;
  sku: string;
  prices: StorePrices;
  onSale: boolean;
  inStock: boolean;
  purchasable: boolean;
  availability: string;
}

export interface PurchaseProduct {
  id: number;
  sku: string;
  prices: StorePrices;
  onSale: boolean;
  inStock: boolean;
  purchasable: boolean;
  availability: string;
  minQty: number;
  maxQty: number;
  stepQty: number;
}

/**
 * Price, variation picker, stock and quantity. All values come from
 * WooCommerce; WooCommerce re-validates price, stock and the variation when
 * the item is added to the cart (Phase 7), so this UI cannot cause an
 * invalid purchase — it only avoids offering one.
 */
export function ProductPurchase({
  product,
  attributes,
  variants,
}: {
  product: PurchaseProduct;
  attributes: PurchaseAttribute[];
  variants: PurchaseVariant[];
}) {
  const isVariable = attributes.length > 0;
  const names = attributes.map((a) => a.name);
  const aliases = useMemo(
    () => new Map(attributes.flatMap((a) => a.terms.map((t) => [t.name.toLowerCase(), t.slug.toLowerCase()] as const))),
    [attributes],
  );

  const [selection, setSelection] = useState<Selection>(() => {
    // Preselect single-option attributes.
    const init: Selection = {};
    for (const a of attributes) if (a.terms.length === 1) init[a.name] = a.terms[0].name;
    return init;
  });
  const [qty, setQty] = useState(product.minQty);

  const variant = isVariable ? findVariant(variants, selection, names, aliases) : undefined;
  const complete = !isVariable || names.every((n) => selection[n]);
  const invalidCombination = isVariable && complete && !variant;

  const view = variant ?? product;
  const canBuy = complete && !invalidCombination && view.inStock && view.purchasable;

  const add = useCartStore((s) => s.add);
  const openPanel = useUiStore((s) => s.open);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  /** Sends only the product/variation id, quantity and chosen attributes. */
  const addToBag = async () => {
    if (!canBuy) return;
    setAdding(true);
    setAddError(null);
    const r = await add({
      id: variant?.id ?? product.id,
      quantity: qty,
      ...(variant ? { variation: names.map((n) => ({ attribute: n, value: selection[n]! })) } : {}),
    });
    setAdding(false);
    if (r.ok) openPanel("bag");
    else setAddError(r.message);
  };

  const status = !complete
    ? "Choose an option to see availability."
    : invalidCombination
      ? "This combination isn’t available."
      : !view.inStock
        ? "Out of stock"
        : view.availability || "In stock";

  return (
    <div className="flex flex-col gap-8">
      <div>
        {variant ? (
          <Price prices={variant.prices} onSale={variant.onSale} className="text-title" />
        ) : (
          <Price prices={product.prices} onSale={product.onSale} className="text-title" />
        )}
        {view.sku && <p className="mt-2 text-caption text-ink-muted">SKU: {view.sku}</p>}
      </div>

      {attributes.map((attr) => (
        <OptionGroup
          key={attr.name}
          attribute={attr}
          selected={selection[attr.name]}
          isAvailable={(value) => isOptionAvailable(variants, selection, attr.name, value, aliases)}
          exists={(value) => optionExists(variants, attr.name, value, aliases)}
          onSelect={(value) =>
            setSelection((s) => ({
              ...s,
              [attr.name]: s[attr.name] === value ? undefined : value,
            }))
          }
        />
      ))}

      <p
        role="status"
        aria-live="polite"
        className={cn("text-body font-medium", canBuy ? "text-brand-strong" : "text-ink-muted")}
      >
        {status}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper
          value={qty}
          min={product.minQty}
          max={product.maxQty}
          step={product.stepQty}
          onChange={setQty}
          disabled={!canBuy}
        />
        <Button
          size="lg"
          className="min-w-56 flex-1 sm:flex-none"
          disabled={!canBuy || adding}
          aria-describedby={addError ? "add-error" : undefined}
          onClick={addToBag}
        >
          {adding ? "Adding…" : "Add to bag"}
        </Button>
      </div>
      {addError && (
        <p id="add-error" role="alert" className="-mt-4 text-body text-danger">
          {addError}
        </p>
      )}
    </div>
  );
}

function OptionGroup({
  attribute,
  selected,
  isAvailable,
  exists,
  onSelect,
}: {
  attribute: PurchaseAttribute;
  selected?: string;
  isAvailable: (value: string) => boolean;
  exists: (value: string) => boolean;
  onSelect: (value: string) => void;
}) {
  const id = useId();
  const terms = attribute.terms.filter((t) => exists(t.name));
  return (
    <fieldset>
      <legend id={id} className="mb-4 text-lg font-semibold tracking-tight">
        {attribute.name}.{" "}
        <span className="text-ink-muted">{selected ? selected : "Which one is right for you?"}</span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby={id}>
        {terms.map((t) => {
          const available = isAvailable(t.name);
          const active = selected === t.name;
          return (
            <button
              key={t.slug}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(t.name)}
              className={cn(
                "min-h-16 rounded-xl px-5 py-4 text-left text-body font-semibold transition-[box-shadow,color] focus-visible:outline-2 focus-visible:outline-offset-2",
                active
                  ? "shadow-[inset_0_0_0_2px_var(--color-brand-strong)]"
                  : "shadow-[inset_0_0_0_1px_#86868b] hover:shadow-[inset_0_0_0_1px_var(--color-ink)]",
                !available && "text-ink-muted line-through decoration-1",
              )}
            >
              {t.name}
              {!available && <span className="sr-only"> (unavailable)</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function QuantityStepper({
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const btn =
    "inline-flex size-11 items-center justify-center rounded-full hover:bg-[#e8e8ed] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2";
  return (
    <div className="flex items-center rounded-button bg-canvas-alt" role="group" aria-label="Quantity">
      <button
        type="button"
        className={btn}
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - step))}
      >
        <Minus aria-hidden className="size-4" />
      </button>
      <output aria-live="polite" className="w-10 text-center text-body font-semibold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={btn}
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + step))}
      >
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}
