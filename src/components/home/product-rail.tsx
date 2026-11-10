import { ButtonLink } from "@/components/ui/button";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "@/components/products/product-card";
import type { StoreProduct } from "@/types/store-api";

/** Horizontally scrolling product row. Renders nothing without live products. */
export function ProductRail({
  id,
  eyebrow,
  title,
  products,
  tone = "default",
}: {
  id: string;
  eyebrow: string;
  title: string;
  products: StoreProduct[];
  tone?: "default" | "alt";
}) {
  if (!products.length) return null;
  return (
    <Section tone={tone} aria-labelledby={`${id}-title`}>
      <Container>
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading align="start" eyebrow={eyebrow} title={<span id={`${id}-title`}>{title}</span>} />
          <ButtonLink href="/shop" variant="link" className="shrink-0 text-body">
            Shop all
          </ButtonLink>
        </Reveal>
      </Container>
      <div className="mt-12 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="mx-auto flex w-max max-w-none snap-x snap-mandatory gap-6 px-gutter pb-4 lg:w-full lg:max-w-page">
          {products.map((p) => (
            <li key={p.id} className="w-[72vw] shrink-0 snap-start sm:w-[42vw] lg:w-[calc((100%-3*1.5rem)/4)]">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
