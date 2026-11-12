import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogResults } from "@/components/products/catalog-results";
import { ProductGridSkeleton } from "@/components/products/product-grid";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/layout";
import { categoryHref } from "@/lib/navigation";
import { getCategories, getCategory } from "@/services/woocommerce/catalog";
import { decodeEntities, htmlToText } from "@/utils/text";

export async function generateStaticParams() {
  const categories = await getCategories();
  // Cache Components needs at least one entry; unknown slugs render on demand.
  return categories.length ? categories.map((c) => ({ slug: c.slug })) : [{ slug: "all" }];
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found", robots: { index: false } };
  const name = decodeEntities(category.name);
  const description = htmlToText(category.description) || `Shop ${name} from ZOOM X.`;
  return {
    title: name,
    description,
    alternates: { canonical: categoryHref(slug) },
    openGraph: {
      title: name,
      description,
      ...(category.image ? { images: [category.image.src] } : {}),
    },
  };
}

export default function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  return (
    <div className="bg-canvas-alt">
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<HeaderSkeleton />}>
          <CategoryHeader params={params} />
        </Suspense>
        <Suspense fallback={<ProductGridSkeleton />}>
          <CategoryProducts params={params} searchParams={searchParams} />
        </Suspense>
      </Container>
    </div>
  );
}

async function CategoryHeader({ params }: Pick<PageProps<"/category/[slug]">, "params">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const name = decodeEntities(category.name);
  const description = htmlToText(category.description);

  return (
    <header className="mb-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name, href: categoryHref(slug) },
        ]}
      />
      <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-prose">
          <h1 className="text-display">{name}.</h1>
          {description && <p className="mt-4 text-lead text-pretty text-ink-muted">{description}</p>}
        </div>
        {category.image && (
          <div className="relative aspect-square w-40 shrink-0 overflow-hidden rounded-card bg-canvas shadow-card md:w-56">
            <Image
              src={category.image.src}
              alt={category.image.alt || name}
              fill
              sizes="224px"
              className="object-contain p-4"
            />
          </div>
        )}
      </div>
    </header>
  );
}

async function CategoryProducts({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  return <CatalogResults basePath={categoryHref(slug)} searchParams={searchParams} category={slug} />;
}

function HeaderSkeleton() {
  return (
    <div aria-hidden className="mb-10 animate-pulse motion-reduce:animate-none">
      <div className="h-4 w-40 rounded-full bg-canvas-alt" />
      <div className="mt-6 h-14 w-2/3 max-w-md rounded-full bg-canvas-alt" />
    </div>
  );
}
