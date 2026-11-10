import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { hero, heroImage, range } from "@/content/home";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-canvas pt-16 pb-section md:pt-24">
      <Container className="flex flex-col items-center text-center">
        <Reveal>
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-brand-strong">{hero.eyebrow}</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 id="hero-title" className="mt-5 max-w-5xl text-display text-balance">
            {hero.title}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-prose text-lead text-pretty text-ink-muted">{hero.lead}</p>
        </Reveal>
        <Reveal delay={0.15} className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href={hero.primary.href} size="lg">
            {hero.primary.label}
          </ButtonLink>
          <ButtonLink href={hero.secondary.href} variant="secondary" size="lg">
            {hero.secondary.label}
          </ButtonLink>
        </Reveal>

        {heroImage ? (
          <Reveal delay={0.2} className="mt-16 w-full max-w-4xl">
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
          // Typographic product line-up until approved packshots exist.
          // Hidden on phones, where the full range list follows immediately.
          <Reveal delay={0.2} className="mt-20 w-full max-sm:hidden">
            <p className="sr-only">Products in the ZOOM X range:</p>
            <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-3 gap-y-3">
              {range.products.slice(0, 6).map((name) => (
                <li
                  key={name}
                  className="rounded-full bg-canvas-alt px-5 py-2.5 text-body font-medium text-ink/80"
                >
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
