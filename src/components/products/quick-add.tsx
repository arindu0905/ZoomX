"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";

/** One-tap add for simple, in-stock products on product cards. */
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
        className="inline-flex h-9 items-center gap-1 rounded-full bg-canvas-alt px-4 text-sm font-medium transition-colors hover:bg-ink hover:text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Plus aria-hidden className="size-4" />
        {busy ? "Adding…" : "Add"}
        <span className="sr-only"> {name} to bag</span>
      </button>
      {error && (
        <p role="alert" className="mt-1 text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
