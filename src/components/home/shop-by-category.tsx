import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { range } from "@/content/home";
import { categoryHref } from "@/lib/navigation";
import type { StoreCategory } from "@/types/store-api";
import { decodeEntities } from "@/utils/text";

/**
 * Shows live WooCommerce categories. Before the store exists it shows the
 * real product names from zoomx.lk, each linking to a shop search.
 */
export function ShopByCategory({ categories }: { categories: StoreCategory[] }) {
  return (
    <Section tone="alt" aria-labelledby="range-title">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={categories.length ? "Shop by category" : range.eyebrow}
            title={<span id="range-title">{range.title}</span>}
            lead={range.lead}
          />
        </Reveal>

        {categories.length ? (
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <li key={c.id}>
                <Reveal delay={Math.min(i, 5) * 0.05}>
                  <Link
                    href={categoryHref(c.slug)}
                    className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-3xl bg-canvas p-7"
                  >
                    <span className="relative z-10 flex items-start justify-between gap-4">
                      <span className="text-title">{decodeEntities(c.name)}</span>
                      <ArrowUpRight
                        aria-hidden
                        className="size-5 shrink-0 text-ink-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                    {c.image && (
                      <Image
                        src={c.image.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-contain p-10 pt-20 transition-transform duration-500 ease-standard group-hover:scale-[1.03]"
                      />
                    )}
                    <span className="relative z-10 text-caption text-ink-muted">
                      {c.count} {c.count === 1 ? "product" : "products"}
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          <Reveal delay={0.1}>
            <ul className="mx-auto mt-14 grid max-w-5xl gap-px overflow-hidden rounded-3xl bg-line sm:grid-cols-2">
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
