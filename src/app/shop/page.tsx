import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogResults } from "@/components/products/catalog-results";
import { ProductGridSkeleton } from "@/components/products/product-grid";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/layout";
import { getCategories } from "@/services/woocommerce/catalog";
import { decodeEntities } from "@/utils/text";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Browse the full ZOOM X range of household cleaning and home-care products.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const categories = (await getCategories()).map((c) => ({
    name: decodeEntities(c.name),
    slug: c.slug,
  }));

  return (
    <Container className="py-12 sm:py-16">
      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
        ]}
      />
      <h1 className="mt-6 mb-10 text-display">Shop.</h1>
      <Suspense fallback={<ProductGridSkeleton />}>
        <CatalogResults basePath="/shop" searchParams={searchParams} categories={categories} />
      </Suspense>
    </Container>
  );
}
