import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { categoryHref } from "@/lib/navigation";
import { decodeEntities } from "@/utils/text";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { range } from "@/content/home";
import type { StoreCategory } from "@/types/store-api";

/**
 * Shows live WooCommerce categories. Before the store exists it shows the
 * real product names from zoomx.lk, each linking to a shop search.
 */
export function ShopByCategory({ categories }: { categories: StoreCategory[] }) {
  return (
    <Section tone={categories.length ? "default" : "alt"} aria-labelledby="range-title">
      <Container>
        <Reveal>
          <SectionHeading
            align={categories.length ? "start" : "center"}
            eyebrow={categories.length ? undefined : range.eyebrow}
            title={<span id="range-title">{range.title}</span>}
            lead={range.lead}
          />
        </Reveal>

        {categories.length ? (
          // Shopify-theme "collection list": square image, title with arrow.
          <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={categoryHref(c.slug)} className="group block">
                  <span className="relative block aspect-square overflow-hidden bg-canvas-alt">
                    {c.image && (
                      <Image
                        src={c.image.src}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 30vw, 46vw"
                        className="object-contain p-6 transition-transform duration-500 ease-standard group-hover:scale-105 sm:p-10"
                      />
                    )}
                  </span>
                  <span className="mt-3 flex items-center gap-2 text-base font-semibold tracking-[0.04em] underline-offset-[0.3em] group-hover:underline sm:text-lg">
                    {decodeEntities(c.name)}
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="text-sm text-ink-muted">
                    {c.count} {c.count === 1 ? "product" : "products"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Reveal delay={0.1}>
            <ul className="mx-auto mt-10 grid max-w-5xl gap-px overflow-hidden bg-line sm:grid-cols-2">
              {range.products.map((name) => (
                <li key={name} className="bg-canvas">
                  <Link
                    href={`/shop?search=${encodeURIComponent(name)}`}
                    className="group flex items-center justify-between gap-4 px-7 py-6 text-lead font-semibold transition-colors hover:bg-canvas-alt/60"
                  >
                    {name}
                    <ArrowUpRight
                      aria-hidden
                      className="size-5 shrink-0 text-ink-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </Container>
    </Section>
  );
}
