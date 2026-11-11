import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "@/components/products/product-card";
import type { StoreProduct } from "@/types/store-api";

/**
 * Shopify-theme "featured collection": heading, four-up grid on desktop,
 * swipeable row on phones, and a centred "View all" button.
 * Renders nothing without live products.
 */
export function ProductRail({
  id,
  title,
  products,
  tone = "default",
  viewAll = { label: "View all", href: "/shop" },
}: {
  id: string;
  /** Kept for callers; Shopify-style sections use the heading alone. */
  eyebrow?: string;
  title: string;
  products: StoreProduct[];
  tone?: "default" | "alt";
  viewAll?: { label: string; href: string } | null;
}) {
  if (!products.length) return null;
  return (
    <Section tone={tone} aria-labelledby={`${id}-title`}>
      <Container>
        <Reveal>
          <h2 id={`${id}-title`} className="text-headline text-balance">
            {title}
          </h2>
        </Reveal>
      </Container>
      <div className="mt-8 overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:overflow-visible [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max snap-x snap-mandatory gap-3 px-gutter md:mx-auto md:grid md:w-full md:max-w-page md:grid-cols-4 md:gap-x-5 md:gap-y-10">
          {products.map((p) => (
            <li key={p.id} className="w-[44vw] shrink-0 snap-start sm:w-[30vw] md:w-auto">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
      {viewAll && (
        <div className="mt-10 flex justify-center px-gutter">
          <ButtonLink href={viewAll.href} variant="secondary">
            {viewAll.label}
          </ButtonLink>
        </div>
      )}
    </Section>
  );
}
