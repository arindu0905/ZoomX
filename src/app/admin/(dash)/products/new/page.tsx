import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader, SearchParamsNotice } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { listCategories } from "@/services/admin/woo";
/** Live per request behind the staff check; not validated for instant navigation (see ../layout.tsx). */export const instant = false;

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage({ searchParams }: PageProps<"/admin/products/new">) {
  const [, categories, sp] = await Promise.all([requireStaff(), listCategories(), searchParams]);
  return (
    <>
      <PageHeader title="Add product" back={{ href: "/admin/products", label: "Products" }} />
      <SearchParamsNotice sp={sp} />
      <ProductForm categories={categories} />
    </>
  );
}
