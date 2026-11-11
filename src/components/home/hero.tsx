import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { hero, heroImage } from "@/content/home";
import type { StoreProduct } from "@/types/store-api";
import { decodeEntities } from "@/utils/text";

/**
 * Shopify-theme "image banner": heading, copy and two buttons beside a
 * product shot. Uses an approved hero image if set, otherwise the splash
 * shot (second image) of the first featured / best-selling product.
 * Without either it is a text banner.
 */
export function Hero({ products = [] }: { products?: StoreProduct[] }) {
  const product = products.find((p) => p.images.length > 0);
  const media = heroImage
    ? { src: heroImage.src, alt: heroImage.alt }
    : product
      ? { src: (product.images[1] ?? product.images[0]).src, alt: decodeEntities(product.name) }
      : null;

  return (
    <section aria-labelledby="hero-title" className="bg-brand-tint">
      <Container className="grid items-center gap-6 py-10 md:min-h-[32rem] md:grid-cols-2 md:gap-12 md:py-16">
        {media && (
          <Reveal className="relative aspect-[9/10] w-full max-md:mx-auto max-md:max-w-xs md:order-last md:max-h-[34rem]">
            <Image
              src={media.src}
              alt={media.alt}
              fill
              priority
              sizes="(min-width: 768px) 45vw, 20rem"
              className="object-contain"
            />
          </Reveal>
        )}
        <div className={media ? "text-center md:text-left" : "mx-auto max-w-2xl py-10 text-center"}>
          <Reveal>
            <p className="text-sm font-semibold tracking-[0.12em] text-brand-strong uppercase">{hero.eyebrow}</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 id="hero-title" className="mt-3 text-display text-balance">
              {hero.title}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lead text-pretty text-ink-muted md:max-w-md">{hero.lead}</p>
          </Reveal>
          <Reveal
            delay={0.15}
            className={
              "mt-8 flex flex-wrap gap-3 " + (media ? "justify-center md:justify-start" : "justify-center")
            }
          >
            <ButtonLink href={hero.primary.href} size="lg">
              {hero.primary.label}
            </ButtonLink>
            <ButtonLink href={hero.secondary.href} variant="secondary" size="lg">
              {hero.secondary.label}
            </ButtonLink>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
