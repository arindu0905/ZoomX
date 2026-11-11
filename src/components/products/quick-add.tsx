"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";

/** Shopify-style quick add for simple, in-stock products on product cards. */
export function QuickAdd({ productId, name }: { productId: number; name: string }) {
  const add = useCartStore((s) => s.add);
  const open = useUiStore((s) => s.open);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative z-10">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await add({ id: productId, quantity: 1 });
          setBusy(false);
          if (r.ok) open("bag");
          else setError(r.message);
        }}
        className="flex min-h-10 w-full items-center justify-center text-sm font-semibold tracking-[0.06em] shadow-[inset_0_0_0_1px_var(--color-ink)] transition-shadow hover:shadow-[inset_0_0_0_2px_var(--color-ink)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {busy ? "Adding…" : "Add to cart"}
        <span className="sr-only"> {name}</span>
      </button>
      {error && (
        <p role="alert" className="mt-1 text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
