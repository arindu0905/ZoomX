import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AdminButton, Card, Field, inputClass, PageHeader, SearchParamsNotice } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { listCategories } from "@/services/admin/woo";
import { decodeEntities, htmlToText } from "@/utils/text";
/** Live per request behind the staff check; not validated for instant navigation (see ../layout.tsx). */export const instant = false;

export const metadata: Metadata = { title: "Categories" };

const fileInput =
  "text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-canvas-alt file:px-3 file:py-2 file:text-sm file:font-semibold";

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  // Staff check first: it reads the session cookie, so nothing below is fetched at build time or for signed-out visitors.
  await requireStaff();
  const [sp, all] = await Promise.all([searchParams, listCategories()]);
  const categories = all.filter((c) => c.slug !== "uncategorized");

  return (
    <>
      <PageHeader title="Categories" />
      <SearchParamsNotice sp={sp} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          {categories.length === 0 && <Card>No categories yet.</Card>}
          {categories.map((c) => {
            const name = decodeEntities(c.name);
            return (
              <Card key={c.id}>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <span className="relative block size-20 shrink-0 overflow-hidden rounded-xl bg-canvas-alt">
                    {c.image && <Image src={c.image.src} alt="" fill sizes="5rem" className="object-contain p-2" />}
                  </span>
                  <form action={updateCategoryAction} className="flex flex-1 flex-col gap-3">
                    <input type="hidden" name="id" value={c.id} />
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <Field label="Name">
                        <input name="name" defaultValue={name} required maxLength={100} className={inputClass} />
                      </Field>
                      <Link href={`/admin/products?category=${c.id}`} className="pb-2 text-sm text-ink-muted hover:text-ink">
                        {c.count} {c.count === 1 ? "product" : "products"}
                      </Link>
                    </div>
                    <Field label="Description" hint="Shown on the category page.">
                      <textarea name="description" rows={2} defaultValue={htmlToText(c.description)} maxLength={1000} className={inputClass} />
                    </Field>
                    <Field label="Replace photo" hint="Optional. JPG, PNG or WebP, up to 5 MB.">
                      <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className={fileInput} />
                    </Field>
                    <div>
                      <AdminButton variant="secondary">Save</AdminButton>
                    </div>
                  </form>
                </div>
                <form action={deleteCategoryAction} className="mt-3 flex justify-end border-t border-line pt-3">
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmButton message={`Delete the “${name}” category? Its products are kept but removed from it.`} aria-label={`Delete ${name}`}>
                    Delete
                  </ConfirmButton>
                </form>
              </Card>
            );
          })}
        </div>
        <Card title="Add a category" className="h-fit">
          <form action={createCategoryAction} className="flex flex-col gap-3">
            <Field label="Name">
              <input name="name" required maxLength={100} className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={3} maxLength={1000} className={inputClass} />
            </Field>
            <Field label="Photo" hint="Optional.">
              <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className={fileInput} />
            </Field>
            <AdminButton>Add category</AdminButton>
          </form>
        </Card>
      </div>
    </>
  );
}
