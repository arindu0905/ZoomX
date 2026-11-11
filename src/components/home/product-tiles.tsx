import Image from "next/image";
import { productHref } from "@/components/products/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import type { StoreProduct } from "@/types/store-api";
import { cn } from "@/utils/cn";
import { decodeEntities, htmlToText } from "@/utils/text";

type Tone = "light" | "alt" | "dark";

const tones: Record<Tone, string> = {
  light: "bg-canvas text-ink",
  alt: "bg-canvas-alt text-ink",
  dark: "bg-ink text-white",
};

/**
 * apple.com homepage pattern: the first products as full-width tiles, the
 * rest as a two-up grid with 12px gutters. Each tile is a product name,
 * one line of copy, "Learn more" / "Buy" pills and the packshot.
 * Renders nothing without live WooCommerce products.
 */
export function ProductTiles({
  products,
  title,
  fullWidth = 2,
}: {
  products: StoreProduct[];
  title: string;
  fullWidth?: number;
}) {
  if (!products.length) return null;
  const wide = products.slice(0, fullWidth);
  const grid = products.slice(fullWidth);

  return (
    <section aria-labelledby="tiles-title" className="flex flex-col gap-tile-gap bg-canvas pb-tile-gap">
      <h2 id="tiles-title" className="sr-only">
        {title}
      </h2>
      {wide.map((p, i) => (
        <ProductTile key={p.id} product={p} tone={i % 2 ? "alt" : "light"} size="wide" />
      ))}
      {grid.length > 0 && (
        <ul className="grid gap-tile-gap px-tile-gap md:grid-cols-2">
          {grid.map((p) => (
            <li key={p.id}>
              <ProductTile product={p} tone="alt" size="half" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProductTile({ product, tone, size }: { product: StoreProduct; tone: Tone; size: "wide" | "half" }) {
  const name = decodeEntities(product.name);
  const image = product.images[0];
  const category = product.categories[0] ? decodeEntities(product.categories[0].name) : null;
  // Short description reads "550 ml · Feature." — keep the feature as the subhead.
  const summary = htmlToText(product.short_description).split(" · ").pop() ?? "";
  const href = productHref(product.slug);

  return (
    <Reveal
      className={cn(
        "relative flex flex-col items-center overflow-hidden text-center",
        tones[tone],
        size === "wide" ? "min-h-[580px] pt-12 md:min-h-[692px] md:pt-14" : "h-full min-h-[500px] pt-12 md:min-h-[580px]",
      )}
    >
      {category && (
        <p className={cn("text-sm font-semibold tracking-tight", tone === "dark" ? "text-white/70" : "text-highlight")}>
          {product.on_sale && product.is_in_stock ? "On sale" : category}
        </p>
      )}
      <h3 className={cn("mt-1 px-6", size === "wide" ? "text-hero" : "text-tile")}>{name}</h3>
      {summary && (
        <p className={cn("mt-2 max-w-xl px-6 text-pretty", size === "wide" ? "text-lead" : "text-body md:text-lg")}>
          {summary}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-3.5 px-6">
        <ButtonLink href={href} size="sm" aria-label={`Learn more about ${name}`}>
          Learn more
        </ButtonLink>
        <ButtonLink href={`${href}#buy`} size="sm" variant="secondary" aria-label={`Buy ${name}`}>
          Buy
        </ButtonLink>
      </div>
      {image && (
        <div className={cn("relative mt-auto w-full", size === "wide" ? "h-[340px] md:h-[440px]" : "h-[280px] md:h-[340px]")}>
          <Image
            src={image.src}
            alt={image.alt || name}
            fill
            sizes={size === "wide" ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
            className="object-contain object-bottom pt-6 transition-transform duration-700 ease-standard hover:scale-[1.02]"
          />
        </div>
      )}
    </Reveal>
  );
}
