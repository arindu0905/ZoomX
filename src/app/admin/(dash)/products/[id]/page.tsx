import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { addVariationAction, deleteVariationAction, saveVariationAction, trashProductAction } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ProductForm } from "@/components/admin/product-form";
import { AdminButton, AdminLinkButton, Badge, Field, inputClass, isNotFound, PageHeader, SearchParamsNotice } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { getProduct, listCategories, listVariations } from "@/services/admin/woo";
import { decodeEntities } from "@/utils/text";

export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [, sp, product, categories] = await Promise.all([
    requireStaff(),
    searchParams,
    getProduct(id).catch((e) => (isNotFound(e) ? null : Promise.reject(e))),
    listCategories(),
  ]);
  if (!product) notFound();
  const isVariable = product.type === "variable";
  const variations = isVariable ? await listVariations(id) : [];
  const optionName = product.attributes.find((a) => a.variation)?.name ?? "Option";

  return (
    <>
      <PageHeader
        title={decodeEntities(product.name)}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <>
            <AdminLinkButton href={`/product/${product.slug}`} target="_blank">
              View on website
            </AdminLinkButton>
            <form action={trashProductAction}>
              <input type="hidden" name="id" value={product.id} />
              <ConfirmButton message={`Delete “${decodeEntities(product.name)}”? It goes to the trash and disappears from the website.`}>Delete product</ConfirmButton>
            </form>
          </>
        }
      />
      <SearchParamsNotice sp={sp} />
      <ProductForm product={product} categories={categories} />

      {isVariable && (
        <section aria-labelledby="options" className="mt-6">
          <h2 id="options" className="mb-3 text-sm font-semibold">
            {optionName} options — price and stock
          </h2>
          <div className="flex flex-col gap-3">
            {variations.map((v) => {
              const label = v.attributes.map((a) => a.option).join(" · ") || `Option ${v.id}`;
              return (
                <div key={v.id} className="flex flex-col gap-3 rounded-2xl bg-canvas p-4 shadow-[0_1px_2px_rgba(0,0,0,0.08)] sm:flex-row sm:items-end">
                  <form action={saveVariationAction} className="grid flex-1 items-end gap-3 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
                    <input type="hidden" name="product_id" value={product.id} />
                    <input type="hidden" name="id" value={v.id} />
                    <div className="text-sm">
                      <p className="font-semibold">{label}</p>
                      <p className="text-xs text-ink-muted">{v.sku}</p>
                      <span className="mt-1 inline-block">
                        <Badge status={v.stock_status} />
                      </span>
                    </div>
                    <Field label="Price (LKR)">
                      <input name="regular_price" inputMode="decimal" defaultValue={v.regular_price} className={inputClass} />
                    </Field>
                    <Field label="Sale price">
                      <input name="sale_price" inputMode="decimal" defaultValue={v.sale_price} placeholder="—" className={inputClass} />
                    </Field>
                    <Field label="Stock">
                      <input name="stock_quantity" inputMode="numeric" defaultValue={v.stock_quantity ?? 0} required className={inputClass} />
                    </Field>
                    <AdminButton variant="secondary">Save</AdminButton>
                  </form>
                  <form action={deleteVariationAction}>
                    <input type="hidden" name="product_id" value={product.id} />
                    <input type="hidden" name="id" value={v.id} />
                    <ConfirmButton message={`Delete the “${label}” option?`} aria-label={`Delete option ${label}`}>
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              );
            })}
            <form action={addVariationAction} className="grid items-end gap-3 rounded-2xl border border-dashed border-line bg-canvas/60 p-4 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
              <input type="hidden" name="product_id" value={product.id} />
              <Field label={`New ${optionName.toLowerCase()}`}>
                <input name="option" required maxLength={60} className={inputClass} />
              </Field>
              <Field label="Price (LKR)">
                <input name="regular_price" required inputMode="decimal" className={inputClass} />
              </Field>
              <Field label="Stock">
                <input name="stock_quantity" inputMode="numeric" defaultValue="0" className={inputClass} />
              </Field>
              <AdminButton>Add option</AdminButton>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
