import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductRail } from "@/components/home/product-rail";
import { productHref } from "@/components/products/product-card";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductPurchase, type PurchaseAttribute, type PurchaseVariant } from "@/components/products/product-purchase";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/layout";
import { categoryHref } from "@/lib/navigation";
import { site } from "@/lib/site";
import { jsonLdString, productJsonLd } from "@/lib/structured-data";
import {
  getPopularProductSlugs,
  getProductBySlug,
  getRelatedProducts,
  type ProductDetail,
} from "@/services/woocommerce/catalog";
import type { StoreProduct } from "@/types/store-api";
import { decodeEntities, htmlToParagraphs, htmlToText } from "@/utils/text";

export async function generateStaticParams() {
  const slugs = await getPopularProductSlugs();
  // Cache Components needs at least one entry; other slugs render on first request.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "sample" }];
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getProductBySlug(slug);
  if (!detail) return { title: "Product not found", robots: { index: false } };
  const { product } = detail;
  const name = decodeEntities(product.name);
  const description =
    htmlToText(product.short_description || product.description).slice(0, 160) || `${name} by ZOOM X.`;
  const images = product.images.slice(0, 1).map((i) => ({ url: i.src, alt: i.alt || name }));
  return {
    title: name,
    description,
    alternates: { canonical: productHref(product.slug) },
    openGraph: { title: name, description, type: "website", images },
  };
}

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={params} />
    </Suspense>
  );
}

async function ProductView({ params }: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const detail = await getProductBySlug(slug);
  if (!detail) notFound();
  const { product } = detail;
  const name = decodeEntities(product.name);
  const category = product.categories[0];
  const description = htmlToParagraphs(product.description);
  const summary = htmlToText(product.short_description);
  const specs = [
    product.formatted_weight && {
      label: "Weight",
      value: decodeEntities(product.formatted_weight),
    },
    product.formatted_dimensions &&
      product.formatted_dimensions !== "N/A" && {
        label: "Dimensions",
        value: decodeEntities(product.formatted_dimensions),
      },
    ...product.attributes
      .filter((a) => !a.has_variations && a.terms.length)
      .map((a) => ({
        label: a.name,
        value: a.terms.map((t) => t.name).join(", "),
      })),
  ].filter(Boolean) as { label: string; value: string }[];

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    ...(category
      ? [
          {
            name: decodeEntities(category.name),
            href: categoryHref(category.slug),
          },
        ]
      : []),
    { name, href: productHref(product.slug) },
  ];

  return (
    <>
      <Container className="py-6 sm:py-10">
        <Breadcrumbs crumbs={crumbs} />
        <div className="mt-6 grid gap-8 md:grid-cols-[1.15fr_1fr] lg:gap-14">
          <ProductGallery images={product.images} name={name} />
          <div
            id="buy"
            className="flex scroll-mt-[calc(var(--spacing-nav)+2rem)] flex-col gap-6 md:sticky md:top-[calc(5rem+2rem)] md:self-start"
          >
            <header>
              <p className="text-xs font-semibold tracking-[0.16em] text-ink-muted uppercase">{site.name}</p>
              <h1 className="mt-2 text-headline text-balance">{name}</h1>
              {product.on_sale && product.is_in_stock && (
                <span className="mt-3 inline-block rounded-full bg-brand-strong px-3 py-1 text-xs font-semibold tracking-[0.06em] text-white">
                  Sale
                </span>
              )}
              {category && (
                <p className="mt-2 text-sm text-ink-muted">
                  <Link href={categoryHref(category.slug)} className="underline underline-offset-[0.3em] hover:text-ink">
                    {decodeEntities(category.name)}
                  </Link>
                </p>
              )}
            </header>
            <ProductPurchase {...toPurchaseProps(detail)} />

            {summary && <p className="text-body text-pretty text-ink-muted">{summary}</p>}

            {/* Shopify-theme collapsible rows */}
            <div className="border-t border-line">
              {description.length > 0 && (
                <details open className="group border-b border-line">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold tracking-[0.04em] [&::-webkit-details-marker]:hidden">
                    <h2 id="details-heading">Description</h2>
                    <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="flex flex-col gap-3 pb-6 text-body text-ink-muted">
                    {description.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </details>
              )}
              {specs.length > 0 && (
                <details className="group border-b border-line">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold tracking-[0.04em] [&::-webkit-details-marker]:hidden">
                    <h2>Specifications</h2>
                    <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <dl className="divide-y divide-line pb-4">
                    {specs.map((s) => (
                      <div key={s.label} className="flex justify-between gap-6 py-3 text-body">
                        <dt className="text-ink-muted">{s.label}</dt>
                        <dd className="text-right">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </div>
          </div>
        </div>
      </Container>

      <Suspense fallback={null}>
        <RelatedProducts product={product} />
      </Suspense>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(toJsonLd(detail, name)),
        }}
      />
    </>
  );
}

async function RelatedProducts({ product }: { product: StoreProduct }) {
  const related = await getRelatedProducts(product);
  return <ProductRail id="related" title="You may also like" products={related} viewAll={null} />;
}

function toPurchaseProps({ product, variants }: ProductDetail) {
  const attributes: PurchaseAttribute[] = product.attributes
    .filter((a) => a.has_variations)
    .map((a) => ({
      name: a.name,
      terms: a.terms.map((t) => ({ name: t.name, slug: t.slug })),
    }));
  const purchaseVariants: PurchaseVariant[] = variants;
  const cart = product.add_to_cart ?? {};
  return {
    attributes,
    variants: purchaseVariants,
    product: {
      id: product.id,
      sku: product.sku,
      prices: product.prices,
      onSale: product.on_sale,
      inStock: product.is_in_stock,
      purchasable: product.is_purchasable,
      availability: product.stock_availability?.text ?? "",
      minQty: Math.max(1, cart.minimum ?? 1),
      maxQty: Math.max(1, Math.min(cart.maximum ?? 99, 99)),
      stepQty: Math.max(1, cart.multiple_of ?? 1),
    },
  };
}

function toJsonLd({ product, variants }: ProductDetail, name: string) {
  const offers = (variants.length ? variants : [null]).map((v) => ({
    sku: v?.sku || product.sku || undefined,
    price: (v ?? product).prices.price,
    minorUnit: product.prices.currency_minor_unit,
    currency: product.prices.currency_code,
    inStock: v ? v.inStock : product.is_in_stock,
  }));
  const rating = Number.parseFloat(product.average_rating);
  return productJsonLd({
    name,
    description: htmlToText(product.short_description || product.description),
    href: productHref(product.slug),
    images: product.images.map((i) => i.src),
    sku: product.sku || undefined,
    offers,
    rating: product.review_count > 0 ? { value: rating, count: product.review_count } : undefined,
  });
}

function ProductSkeleton() {
  return (
    <Container className="py-8 sm:py-12" aria-hidden>
      <div className="h-4 w-48 rounded-full bg-canvas-alt" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="aspect-square animate-pulse bg-canvas-alt motion-reduce:animate-none" />
        <div className="flex flex-col gap-4">
          <div className="h-12 w-3/4 rounded-full bg-canvas-alt" />
          <div className="h-6 w-1/3 rounded-full bg-canvas-alt" />
        </div>
      </div>
    </Container>
  );
}
