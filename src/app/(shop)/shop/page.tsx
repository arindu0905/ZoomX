import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogResults } from "@/components/products/catalog-results";
import { CategoryRow } from "@/components/products/category-row";
import { ProductGridSkeleton } from "@/components/products/product-grid";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/layout";
import { Words } from "@/components/ui/reveal";
import { getCategories } from "@/services/woocommerce/catalog";
import { decodeEntities } from "@/utils/text";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Browse the full ZOOM X range of household cleaning and home-care products.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const storeCategories = await getCategories();
  const categories = storeCategories.map((c) => ({
    name: decodeEntities(c.name),
    slug: c.slug,
  }));

  return (
    <div className="bg-canvas-alt">
      <Container className="py-10 sm:py-14">
        <Breadcrumbs
          crumbs={[
            { name: "Home", href: "/" },
            { name: "Shop", href: "/shop" },
          ]}
        />
        {/* apple.com/store masthead: bold title, muted second line */}
        <header className="mt-6 flex flex-col gap-x-6 gap-y-2 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-display">
            <Words text="Shop." on="load" />
          </h1>
          <p className="max-w-md animate-rise text-title font-semibold text-ink-muted [--i:3] lg:pb-2 lg:text-right">
            The best way to buy the products you love.
          </p>
        </header>
        <CategoryRow categories={storeCategories} className="mt-10 -mx-2" />
        <div className="mt-8">
          <Suspense fallback={<ProductGridSkeleton />}>
            <CatalogResults basePath="/shop" searchParams={searchParams} categories={categories} />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}
