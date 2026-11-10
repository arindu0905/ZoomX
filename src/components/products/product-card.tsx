import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { StoreProduct } from "@/types/store-api";
import { decodeEntities } from "@/utils/text";
import { Price } from "./price";
import { QuickAdd } from "./quick-add";

export const productHref = (slug: string) => `/product/${encodeURIComponent(slug)}`;

/**
 * Minimal product card. Simple in-stock products get a quick "Add"; products
 * with options link to their page to choose a size first.
 */
export function ProductCard({ product }: { product: StoreProduct }) {
  const image = product.images[0];
  const rating = Number.parseFloat(product.average_rating);
  const name = decodeEntities(product.name);
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-canvas-alt">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt || name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 80vw"
            className="object-contain p-8 transition-transform duration-500 ease-standard group-hover:scale-[1.03]"
          />
        ) : (
          <div aria-hidden className="flex h-full items-center justify-center text-caption text-ink-muted">
            Image coming soon
          </div>
        )}
        {product.on_sale && product.is_in_stock && (
          <span className="absolute top-4 left-4 rounded-full bg-canvas px-3 py-1 text-caption font-semibold text-danger">
            Sale
          </span>
        )}
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-1.5">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link href={productHref(product.slug)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {name}
          </Link>
        </h3>
        {product.review_count > 0 && rating > 0 && (
          <p className="flex items-center gap-1 text-caption text-ink-muted">
            <Star aria-hidden className="size-3.5 fill-ink text-ink" />
            <span>
              {rating.toFixed(1)} <span className="sr-only">out of 5,</span> ({product.review_count})
            </span>
          </p>
        )}
        <Price prices={product.prices} onSale={product.on_sale} className="text-body" />
        {!product.is_in_stock && <p className="text-caption font-medium text-ink-muted">Out of stock</p>}
        {product.is_in_stock && product.is_purchasable && (
          <div className="mt-2">
            {product.type === "simple" && !product.has_options ? (
              <QuickAdd productId={product.id} name={name} />
            ) : (
              <span className="text-caption text-ink-muted">Choose options</span>
            )}
          </div>
        )}
      </div>
      {/* Visible focus ring for the stretched link */}
      <span className="pointer-events-none absolute -inset-2 rounded-[28px] ring-brand-strong group-has-[:focus-visible]:ring-2" />
    </article>
  );
}
