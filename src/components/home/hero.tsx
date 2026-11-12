import type React from "react";
import Image from "next/image";
import { HeroLineup } from "@/components/home/hero-lineup";
import { productHref } from "@/components/products/product-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Words } from "@/components/ui/reveal";
import { hero as defaultHero, heroImage, range } from "@/content/home";
import type { StoreProduct } from "@/types/store-api";
import { decodeEntities } from "@/utils/text";
import { tint } from "@/utils/tint";

/** Where the three aurora colours sit behind the hero (left %, top %). */
const AURORA_SPOTS = [
  [4, 34],
  [56, 16],
  [30, 56],
];

/** Soap bubbles rising behind the line-up: left %, size px, seconds to rise, start delay s, sideways sway px. */
const BUBBLES = [
  [6, 34, 13, 0, 24],
  [14, 18, 10, 4, -16],
  [23, 52, 16, 7, 30],
  [34, 22, 11, 2, -22],
  [45, 14, 9, 6, 14],
  [56, 40, 14, 1, -28],
  [66, 20, 10, 8, 18],
  [75, 60, 17, 3, -34],
  [84, 26, 12, 5, 20],
  [93, 16, 9, 9, -12],
];

/** Stagger step for the `animate-rise` entrance. */
const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * Opening tile: one headline, one line of copy, two CTAs, then the product
 * line-up over a slow wash of the bottles' own colours. Uses the WooCommerce
 * packshots when the store has them, an approved hero image if set, or a
 * typographic line-up.
 */
export function Hero({
  products = [],
  hero = defaultHero,
}: {
  products?: StoreProduct[];
  /** Editable in WordPress (ZOOM X → Site content). */
  hero?: typeof defaultHero;
}) {
  const lineup = products.filter((p) => p.images[0]).slice(0, 7);
  const mid = Math.floor(lineup.length / 2);
  const aurora = [lineup[mid - 1], lineup[mid], lineup[mid + 1]].filter(Boolean).map((p) => tint(p.slug).glow);

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-canvas-alt pt-14 md:pt-20">
      {aurora.length > 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {aurora.map((color, i) => (
            <span
              key={i}
              style={
                {
                  background: color,
                  left: `${AURORA_SPOTS[i][0]}%`,
                  top: `${AURORA_SPOTS[i][1]}%`,
                  "--i": i,
                } as React.CSSProperties
              }
              className="aurora absolute size-[46vw] max-h-[640px] max-w-[640px] rounded-full opacity-80 blur-[90px]"
            />
          ))}
          {BUBBLES.map(([left, size, t, d, sway], i) => (
            <span
              key={`b${i}`}
              style={
                {
                  left: `${left}%`,
                  width: size,
                  height: size,
                  "--t": `${t}s`,
                  "--d": `${d}s`,
                  "--sway": `${sway}px`,
                } as React.CSSProperties
              }
              className="bubble"
            />
          ))}
        </div>
      )}
      <Container className="relative flex flex-col items-center text-center">
        {/* CSS entrances: nothing here waits for JavaScript to become visible. */}
        <p className="animate-rise text-lg font-semibold tracking-tight text-highlight">{hero.eyebrow}</p>
        <h1 id="hero-title" className="mt-2 max-w-5xl text-display text-balance">
          <Words text={hero.title} on="load" />
        </h1>
        <p style={rise(4)} className="animate-rise mx-auto mt-4 max-w-2xl text-lead text-pretty text-ink/80">
          {hero.lead}
        </p>
        <div style={rise(6)} className="animate-rise mt-7 flex flex-wrap justify-center gap-3.5">
          <ButtonLink href={hero.primary.href}>{hero.primary.label}</ButtonLink>
          <ButtonLink href={hero.secondary.href} variant="secondary">
            {hero.secondary.label}
          </ButtonLink>
        </div>

        {lineup.length > 0 ? (
          <div className="mt-10 w-full md:mt-14">
            <HeroLineup
              items={lineup.map((p) => ({
                id: p.id,
                name: decodeEntities(p.name),
                href: productHref(p.slug),
                src: p.images[0].src,
              }))}
            />
          </div>
        ) : heroImage ? (
          <div style={rise(8)} className="animate-rise mt-12 w-full max-w-4xl pb-section">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              width={heroImage.width}
              height={heroImage.height}
              priority
              sizes="(min-width: 1024px) 896px, 100vw"
              className="mx-auto h-auto w-full"
            />
          </div>
        ) : (
          // Typographic line-up until the store has packshots.
          <div style={rise(8)} className="animate-rise mt-14 w-full pb-section max-sm:hidden">
            <p className="sr-only">Products in the ZOOM X range:</p>
            <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-3 gap-y-3">
              {range.products.slice(0, 6).map((name) => (
                <li key={name} className="rounded-full bg-canvas px-5 py-2.5 text-body font-medium text-ink/80">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
