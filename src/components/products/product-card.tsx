import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import type { StoreProduct } from "@/types/store-api";
import { decodeEntities } from "@/utils/text";
import { tintStyle } from "@/utils/tint";
import { Price } from "./price";
import { QuickAdd } from "./quick-add";

export const productMorphName = (id: number) => `product-${id}`;

/** Shared-element morph between card and product page; renders children as-is without a name. */
export function Morph({ name, children }: { name?: string; children: ReactNode }) {
  if (!name) return <>{children}</>;
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}

export const productHref = (slug: string) => `/product/${encodeURIComponent(slug)}`;

/**
 * Minimal product card. Simple in-stock products get a quick "Add"; products
 * with options link to their page to choose a size first.
 */
/**
 * `morph`: the bottle glides into the product page photo on navigation
 * (View Transitions). Only for lists where each product appears once — two
 * elements with the same transition name on a page cancel the animation.
 */
export function ProductCard({ product, morph = false }: { product: StoreProduct; morph?: boolean }) {
  const image = product.images[0];
  const rating = Number.parseFloat(product.average_rating);
  const name = decodeEntities(product.name);
  return (
    <article className="group relative flex h-full flex-col rounded-card bg-canvas p-5 shadow-card transition-[box-shadow,transform] duration-300 ease-standard hover:scale-[1.01] hover:shadow-card-hover active:scale-[0.98] sm:p-7">
      {product.on_sale && product.is_in_stock && (
        <p className="mb-1 text-caption font-semibold tracking-tight text-highlight">Sale</p>
      )}
      <div style={tintStyle(product.slug)} className="tint-surface relative aspect-square overflow-hidden rounded-[12%]">
        {image ? (
          <Morph name={morph ? productMorphName(product.id) : undefined}>
          <Image
            src={image.src}
            alt={image.alt || name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 80vw"
            className="object-contain p-4 drop-shadow-[0_14px_14px_rgba(0,0,0,0.12)] transition-transform duration-500 ease-emphasized group-hover:scale-[1.08] group-hover:-rotate-3 sm:p-6"
          />
          </Morph>
        ) : (
          <div aria-hidden className="flex h-full items-center justify-center text-caption text-ink-muted">
            Image coming soon
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-1.5">
        <h3 className="text-body font-semibold tracking-tight sm:text-lg">
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
      <span className="pointer-events-none absolute inset-0 rounded-card ring-brand-strong ring-offset-2 group-has-[:focus-visible]:ring-2" />
    </article>
  );
}
