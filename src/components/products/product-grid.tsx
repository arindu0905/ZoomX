import type React from "react";
import type { StoreProduct } from "@/types/store-api";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id} className="animate-rise h-full" style={{ "--i": Math.min(i, 11) } as React.CSSProperties}>
          <ProductCard product={p} morph />
        </li>
      ))}
    </ul>
  );
}

/** Same footprint as the grid, shown while results stream in. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-card bg-canvas p-5 shadow-card sm:p-7">
          <div className="shimmer aspect-square rounded-card" />
          <div className="shimmer mt-5 h-5 w-3/4 rounded-full" />
          <div className="shimmer mt-2 h-4 w-1/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}
