import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { saveProductAction, saveVariationAction } from "@/app/admin/actions";
import { AdminButton, AdminLinkButton, Badge, Card, Field, inputClass, Notice, PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { getProduct, listVariations } from "@/services/admin/woo";
import { StoreApiError } from "@/services/woocommerce/store-api";
import { decodeEntities, htmlToText } from "@/utils/text";

export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireStaff();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const sp = await searchParams;
  const product = await getProduct(id).catch((e) => {
    if (e instanceof StoreApiError && e.status === 404) notFound();
    throw e;
  });
  const isVariable = product.type === "variable";
  const variations = isVariable ? await listVariations(id) : [];
  const name = decodeEntities(product.name);

  return (
    <>
      <PageHeader
        title={name}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <AdminLinkButton href={`/product/${product.slug}`} target="_blank">
            View on website
          </AdminLinkButton>
        }
      />
      <Notice saved={typeof sp.saved === "string" ? sp.saved : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />

      <form action={saveProductAction} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <input type="hidden" name="id" value={product.id} />
        <input type="hidden" name="is_variable" value={isVariable ? "1" : "0"} />
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-col gap-4">
              <Field label="Name">
                <input name="name" defaultValue={name} required maxLength={200} className={inputClass} />
              </Field>
              <Field label="Short description" hint="Shown under the product name. Plain text.">
                <textarea name="short_description" rows={3} defaultValue={htmlToText(product.short_description)} className={inputClass} />
              </Field>
            </div>
          </Card>

          {!isVariable && (
            <Card title="Pricing">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price (LKR)">
                  <input name="regular_price" inputMode="decimal" defaultValue={product.regular_price} placeholder="0.00" className={inputClass} />
                </Field>
                <Field label="Sale price (LKR)" hint="Leave empty for no sale.">
                  <input name="sale_price" inputMode="decimal" defaultValue={product.sale_price} placeholder="—" className={inputClass} />
                </Field>
              </div>
            </Card>
          )}

          {!isVariable && (
            <Card title="Inventory">
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="manage_stock" defaultChecked={product.manage_stock} /> Track stock quantity
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Quantity" hint="Used when tracking is on. Goes down automatically with each order.">
                    <input name="stock_quantity" inputMode="numeric" defaultValue={product.stock_quantity ?? ""} className={inputClass} />
                  </Field>
                  <Field label="Availability" hint="Used when tracking is off.">
                    <select name="stock_status" defaultValue={product.stock_status === "outofstock" ? "outofstock" : "instock"} className={inputClass}>
                      <option value="instock">In stock</option>
                      <option value="outofstock">Out of stock</option>
                    </select>
                  </Field>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Status">
            <div className="flex flex-col gap-3">
              <select name="status" defaultValue={product.status} className={inputClass} aria-label="Status">
                <option value="publish">Published — visible on the website</option>
                <option value="draft">Draft — hidden</option>
                <option value="private">Private — hidden</option>
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="featured" defaultChecked={product.featured} /> Featured on the homepage
              </label>
              <AdminButton>Save product</AdminButton>
            </div>
          </Card>
          {product.images[0] && (
            <Card title="Image">
              <span className="relative block aspect-square overflow-hidden rounded-xl bg-canvas-alt">
                <Image src={product.images[0].src} alt="" fill sizes="20rem" className="object-contain p-4" />
              </span>
              <p className="mt-2 text-xs text-ink-muted">Photos are managed in WordPress → Media.</p>
            </Card>
          )}
          <Card title="Details">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">SKU</dt>
                <dd>{product.sku || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Category</dt>
                <dd className="text-right">{product.categories.map((c) => decodeEntities(c.name)).join(", ") || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Units sold</dt>
                <dd className="tabular-nums">{product.total_sales}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </form>

      {isVariable && (
        <section aria-labelledby="options" className="mt-6">
          <h2 id="options" className="mb-3 text-sm font-semibold">
            Options — price and stock
          </h2>
          <div className="flex flex-col gap-3">
            {variations.map((v) => (
              <form
                key={v.id}
                action={saveVariationAction}
                className="grid items-end gap-3 rounded-2xl bg-canvas p-4 shadow-[0_1px_2px_rgba(0,0,0,0.08)] sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto]"
              >
                <input type="hidden" name="product_id" value={product.id} />
                <input type="hidden" name="id" value={v.id} />
                <div className="text-sm">
                  <p className="font-semibold">{v.attributes.map((a) => a.option).join(" · ") || `Option ${v.id}`}</p>
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
            ))}
          </div>
        </section>
      )}
    </>
  );
}
