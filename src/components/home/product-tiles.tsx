import Image from "next/image";
import { productHref } from "@/components/products/product-card";
import { Price } from "@/components/products/price";
import { ButtonLink } from "@/components/ui/button";
import { Tilt } from "@/components/ui/tilt";
import type { StoreProduct } from "@/types/store-api";
import { cn } from "@/utils/cn";
import { decodeEntities, htmlToText } from "@/utils/text";
import { tintStyle } from "@/utils/tint";

/**
 * Bento of product tiles, each washed in its bottle's own colour. The first
 * tile runs full width with copy beside the packshot; the rest sit two-up
 * (an odd one out closes the grid at full width).
 * Renders nothing without live WooCommerce products.
 */
export function ProductTiles({ products, title }: { products: StoreProduct[]; title: string }) {
  if (!products.length) return null;
  const [lead, ...grid] = products;

  return (
    <section aria-labelledby="tiles-title" className="flex flex-col gap-tile-gap bg-canvas py-tile-gap">
      <h2 id="tiles-title" className="sr-only">
        {title}
      </h2>
      <div className="px-tile-gap">
        <ProductTile product={lead} size="wide" />
      </div>
      {grid.length > 0 && (
        <ul
          aria-label="More products — swipe for more"
          className="tile-rail flex snap-x snap-mandatory gap-tile-gap overflow-x-auto scroll-px-tile-gap px-tile-gap pb-1 [scrollbar-width:none] md:grid md:snap-none md:grid-cols-2 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {grid.map((p, i) => {
            const closing = grid.length % 2 === 1 && i === grid.length - 1;
            return (
              <li key={p.id} className={cn("w-[84%] shrink-0 snap-start md:w-auto", closing && "md:col-span-2")}>
                <ProductTile product={p} size={closing ? "wide" : "half"} flip={closing} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Dark-on-tint buttons: the brand green fights most of the bottle colours. */
const solid = "!bg-ink hover:!bg-black";
const outline = "!text-ink !shadow-[inset_0_0_0_1px_var(--color-ink)] hover:!bg-ink hover:!text-white";

function ProductTile({
  product,
  size,
  flip,
}: {
  product: StoreProduct;
  size: "wide" | "half";
  /** Wide tiles only: packshot on the left instead of the right. */
  flip?: boolean;
}) {
  const name = decodeEntities(product.name);
  const image = product.images[0];
  const category = product.categories[0] ? decodeEntities(product.categories[0].name) : null;
  // Short description reads "550 ml · Feature." — keep the feature as the subhead.
  const summary = htmlToText(product.short_description).split(" · ").pop() ?? "";
  const href = productHref(product.slug);
  const wide = size === "wide";

  return (
    <Tilt
      style={tintStyle(product.slug)}
      className={cn(
        "reveal group/tile tint-surface relative flex h-full flex-col items-center overflow-clip rounded-tile text-center",
        wide
          ? "min-h-[580px] pt-12 md:min-h-[560px] md:flex-row md:items-stretch md:pt-0 md:text-left"
          : "min-h-[500px] pt-12 md:min-h-[580px]",
        wide && flip && "md:flex-row-reverse",
      )}
    >
      <>
        <div
          className={cn(
            "relative flex flex-col items-center",
            wide && "md:flex-1 md:items-start md:justify-center md:py-16 md:pl-[8%]",
            wide && flip && "md:pr-[8%] md:pl-0",
          )}
        >
          {category && (
            <p className="text-sm font-semibold tracking-tight text-(--tint-ink)">
              {product.on_sale && product.is_in_stock ? "On sale" : category}
            </p>
          )}
          <h3 className={cn("mt-1 px-6 text-balance", wide ? "text-hero md:px-0 md:text-headline" : "text-tile")}>{name}</h3>
          {summary && (
            <p
              className={cn(
                "mt-2 max-w-xl px-6 text-pretty text-ink/75",
                wide ? "text-lead md:mt-4 md:max-w-md md:px-0" : "text-body md:text-lg",
              )}
            >
              {summary}
            </p>
          )}
          <Price
            prices={product.prices}
            onSale={product.on_sale}
            className={cn("mt-3 font-semibold", wide ? "text-title md:mt-5" : "text-lg")}
          />
          <div className={cn("mt-5 flex flex-wrap justify-center gap-3.5 px-6", wide && "md:mt-7 md:px-0")}>
            <ButtonLink href={href} size={wide ? "md" : "sm"} className={solid} aria-label={`Learn more about ${name}`}>
              Learn more
            </ButtonLink>
            <ButtonLink
              href={`${href}#buy`}
              size={wide ? "md" : "sm"}
              variant="secondary"
              className={outline}
              aria-label={`Buy ${name}`}
            >
              Buy
            </ButtonLink>
          </div>
        </div>

        {image && (
          <div
            className={cn(
              "tilt-target relative mt-auto w-full",
              wide ? "h-[340px] md:mt-0 md:h-auto md:flex-1" : "h-[280px] md:h-[340px]",
            )}
          >
            <span
              aria-hidden
              className="tint-halo absolute top-1/2 left-1/2 aspect-square h-[115%] -translate-x-1/2 -translate-y-1/2"
            />
            <Image
              src={image.src}
              alt={image.alt || name}
              fill
              sizes={wide ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 50vw, 100vw"}
              className={cn(
                "float-in object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.16)] transition-[translate,scale,rotate] duration-700 ease-emphasized group-hover/tile:-translate-y-3 group-hover/tile:scale-[1.04] group-hover/tile:-rotate-2",
                wide ? "object-bottom pt-6 md:object-center md:p-12" : "object-bottom pt-6 pb-8",
              )}
            />
          </div>
        )}
      </>
    </Tilt>
  );
}
