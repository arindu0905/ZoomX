import type { StoreProduct } from "@/types/store-api";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.id} className="h-full">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

/** Same footprint as the grid, shown while results stream in. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse motion-reduce:animate-none">
          <div className="aspect-square bg-canvas-alt" />
          <div className="mt-5 h-5 w-3/4 rounded-full bg-canvas-alt" />
          <div className="mt-2 h-4 w-1/3 rounded-full bg-canvas-alt" />
        </div>
      ))}
    </div>
  );
}
