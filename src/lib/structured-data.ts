import { siteUrl } from "@/lib/site";

/**
 * schema.org JSON-LD builders. Values come from WooCommerce data passed in —
 * nothing here invents prices, ratings or availability.
 */

export interface Crumb {
  name: string;
  href: string;
}

const abs = (href: string) => new URL(href, siteUrl).toString();

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.href),
    })),
  };
}

export interface ProductOfferInput {
  sku?: string;
  /** Minor-unit integer strings from the Store API. */
  price: string;
  minorUnit: number;
  currency: string;
  inStock: boolean;
}

export function productJsonLd(input: {
  name: string;
  description: string;
  href: string;
  images: string[];
  sku?: string;
  offers: ProductOfferInput[];
  rating?: { value: number; count: number };
}) {
  const toMajor = (o: ProductOfferInput) => (Number.parseInt(o.price, 10) / 10 ** o.minorUnit).toFixed(o.minorUnit);
  const offer = (o: ProductOfferInput) => ({
    "@type": "Offer",
    url: abs(input.href),
    ...(o.sku ? { sku: o.sku } : {}),
    price: toMajor(o),
    priceCurrency: o.currency,
    availability: o.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
  });

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: abs(input.href),
    ...(input.images.length ? { image: input.images } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    brand: { "@type": "Brand", name: "ZOOM X" },
    offers: input.offers.length === 1 ? offer(input.offers[0]) : input.offers.map(offer),
    ...(input.rating && input.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating.value,
            reviewCount: input.rating.count,
          },
        }
      : {}),
  };
}

/** Serialises JSON-LD safely for a <script> tag (no `</script>` breakout). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
