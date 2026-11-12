import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CategoryRow } from "@/components/products/category-row";
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
            eyebrow={categories.length ? "Shop by category" : range.eyebrow}
            title={<span id="range-title">{range.title}</span>}
            lead={range.lead}
          />
        </Reveal>

        {categories.length ? (
          <CategoryRow categories={categories} className="mt-12 flex justify-center" />
        ) : (
          <Reveal delay={0.1}>
            <ul className="mx-auto mt-14 grid max-w-5xl gap-px overflow-hidden rounded-card bg-line sm:grid-cols-2">
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
