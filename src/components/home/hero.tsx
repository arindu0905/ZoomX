import type React from "react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { hero as defaultHero, heroImage, range } from "@/content/home";
import type { StoreProduct } from "@/types/store-api";
import { decodeEntities } from "@/utils/text";

/**
 * apple.com-style opening tile: one headline, one line of copy, two pill
 * CTAs, then the product line-up. Uses the WooCommerce packshots when the
 * store has them, an approved hero image if set, or a typographic line-up.
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

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-canvas-alt pt-14 md:pt-20">
      <Container className="flex flex-col items-center text-center">
        <Reveal>
          <p className="text-lg font-semibold tracking-tight text-highlight">{hero.eyebrow}</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 id="hero-title" className="mt-2 max-w-4xl text-hero text-balance">
            {hero.title}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-3 max-w-2xl text-lead text-pretty">{hero.lead}</p>
        </Reveal>
        <Reveal delay={0.15} className="mt-6 flex flex-wrap justify-center gap-3.5">
          <ButtonLink href={hero.primary.href}>{hero.primary.label}</ButtonLink>
          <ButtonLink href={hero.secondary.href} variant="secondary">
            {hero.secondary.label}
          </ButtonLink>
        </Reveal>

        {lineup.length > 0 ? (
          <Reveal delay={0.2} className="mt-10 w-full md:mt-14">
            <ul
              aria-label="The ZOOM X range"
              className="mx-auto flex max-w-6xl items-end justify-center [--overlap:-3.5rem] sm:[--overlap:-6rem]"
            >
              {lineup.map((p, i) => {
                const mid = (lineup.length - 1) / 2;
                const lift = Math.abs(i - mid);
                return (
                  <li
                    key={p.id}
                    style={{ zIndex: 10 - Math.round(lift), marginInline: "calc(var(--overlap) / 2)", "--i": 3 + lift * 2 } as React.CSSProperties}
                    className={(lift > 2 ? "max-sm:hidden " : "") + "animate-rise"}
                  >
                    <Image
                      src={p.images[0].src}
                      alt={decodeEntities(p.name)}
                      width={450}
                      height={500}
                      priority={lift < 1}
                      sizes="(min-width: 1024px) 300px, 34vw"
                      style={{ transform: `scale(${1 - lift * 0.07})`, transformOrigin: "bottom center" }}
                      className="h-auto w-[34vw] max-w-[300px] drop-shadow-[0_24px_24px_rgba(0,0,0,0.12)] transition-[translate] duration-500 ease-standard hover:-translate-y-3"
                    />
                  </li>
                );
              })}
            </ul>
          </Reveal>
        ) : heroImage ? (
          <Reveal delay={0.2} className="mt-12 w-full max-w-4xl pb-section">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              width={heroImage.width}
              height={heroImage.height}
              priority
              sizes="(min-width: 1024px) 896px, 100vw"
              className="mx-auto h-auto w-full"
            />
          </Reveal>
        ) : (
          // Typographic line-up until the store has packshots.
          <Reveal delay={0.2} className="mt-14 w-full pb-section max-sm:hidden">
            <p className="sr-only">Products in the ZOOM X range:</p>
            <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-3 gap-y-3">
              {range.products.slice(0, 6).map((name) => (
                <li key={name} className="rounded-full bg-canvas px-5 py-2.5 text-body font-medium text-ink/80">
                  {name}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
