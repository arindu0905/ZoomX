import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { StoreProduct } from "@/types/store-api";
import { decodeEntities } from "@/utils/text";
import { Price } from "./price";
import { QuickAdd } from "./quick-add";

export const productHref = (slug: string) => `/product/${encodeURIComponent(slug)}`;

/**
 * Shopify-theme product card: square media (second image on hover), Sale /
 * Sold out badge, title, price and a full-width quick-add button. Products
 * with options link to their page to choose one first.
 */
export function ProductCard({ product }: { product: StoreProduct }) {
  const [image, hoverImage] = product.images;
  const rating = Number.parseFloat(product.average_rating);
  const name = decodeEntities(product.name);
  const href = productHref(product.slug);
  const soldOut = !product.is_in_stock;
  const sizes = "(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 46vw";

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden bg-canvas-alt">
        {image ? (
          <>
            <Image
              src={image.src}
              alt={image.alt || name}
              fill
              sizes={sizes}
              className="object-contain p-4 transition-[opacity,transform] duration-500 ease-standard group-hover:scale-[1.03] sm:p-6"
            />
            {hoverImage && (
              <Image
                src={hoverImage.src}
                alt=""
                fill
                sizes={sizes}
                className="object-contain p-4 opacity-0 transition-opacity duration-500 ease-standard group-hover:opacity-100 max-md:hidden sm:p-6"
              />
            )}
          </>
        ) : (
          <div aria-hidden className="flex h-full items-center justify-center text-caption text-ink-muted">
            Image coming soon
          </div>
        )}
        {(soldOut || product.on_sale) && (
          <span
            className={
              "absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.06em] text-white " +
              (soldOut ? "bg-ink/70" : "bg-brand-strong")
            }
          >
            {soldOut ? "Sold out" : "Sale"}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        <h3 className="text-[0.9375rem] leading-snug tracking-[0.04em] sm:text-base">
          <Link
            href={href}
            className="underline-offset-[0.3em] after:absolute after:inset-0 group-hover:underline focus-visible:outline-none"
          >
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
        <Price prices={product.prices} onSale={product.on_sale} className="text-[0.9375rem] tracking-[0.04em]" />
        {product.is_in_stock && product.is_purchasable && (
          <div className="mt-auto pt-3">
            {product.type === "simple" && !product.has_options ? (
              <QuickAdd productId={product.id} name={name} />
            ) : (
              <Link
                href={href}
                className="relative z-10 flex min-h-10 w-full items-center justify-center text-sm font-semibold tracking-[0.06em] shadow-[inset_0_0_0_1px_var(--color-ink)] transition-shadow hover:shadow-[inset_0_0_0_2px_var(--color-ink)]"
              >
                Choose options<span className="sr-only"> for {name}</span>
              </Link>
            )}
          </div>
        )}
      </div>
      {/* Visible focus ring for the stretched link */}
      <span className="pointer-events-none absolute -inset-1 ring-brand-strong group-has-[h3_a:focus-visible]:ring-2" />
    </article>
  );
}
