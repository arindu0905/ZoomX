import Image from "next/image";
import { createProductAction, saveProductAction } from "@/app/admin/actions";
import type { AdminCategory, AdminProduct } from "@/services/admin/woo";
import { decodeEntities, htmlToParagraphs, htmlToText } from "@/utils/text";
import { AdminButton, Card, Field, inputClass } from "./ui";

/** Create / edit form for a product. Variable products edit price and stock per option, below the form. */
export function ProductForm({ product, categories }: { product?: AdminProduct; categories: AdminCategory[] }) {
  const isNew = !product;
  const isVariable = product?.type === "variable";
  const selected = new Set(product?.categories.map((c) => c.id) ?? []);

  return (
    <form action={isNew ? createProductAction : saveProductAction} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {product && (
        <>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="is_variable" value={isVariable ? "1" : "0"} />
          <input type="hidden" name="images_touched" value="1" />
        </>
      )}
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <input name="name" defaultValue={product ? decodeEntities(product.name) : ""} required maxLength={200} className={inputClass} />
            </Field>
            <Field label="Short description" hint="Shown under the product name. Plain text.">
              <textarea name="short_description" rows={2} defaultValue={product ? htmlToText(product.short_description) : ""} maxLength={2000} className={inputClass} />
            </Field>
            <Field label="Full description" hint="Leave a blank line between paragraphs.">
              <textarea
                name="description"
                rows={8}
                defaultValue={product ? htmlToParagraphs(product.description).join("\n\n") : ""}
                maxLength={20000}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card title="Photos">
          {product && product.images.length > 0 && (
            <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {product.images.map((img, i) => (
                <li key={img.id}>
                  <label className="block cursor-pointer">
                    <span className="relative block aspect-square overflow-hidden rounded-xl bg-canvas-alt">
                      <Image src={img.src} alt="" fill sizes="10rem" className="object-contain p-2" />
                      {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">Main</span>}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs">
                      <input type="checkbox" name="keep_image" value={img.id} defaultChecked /> Keep
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <Field label={product?.images.length ? "Add a photo" : "Photo"} hint="JPG, PNG or WebP, up to 5 MB. Untick Keep to remove a photo; the first kept photo is the main one.">
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-canvas-alt file:px-3 file:py-2 file:text-sm file:font-semibold" />
          </Field>
        </Card>

        {isNew && (
          <Card title="Product type">
            <div className="flex flex-col gap-4">
              <Field label="Type">
                <select name="type" defaultValue="simple" className={inputClass}>
                  <option value="simple">Single product — one price and stock</option>
                  <option value="variable">With options — e.g. fragrances or sizes, each with its own price and stock</option>
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Option name" hint="Only for products with options, e.g. Fragrance.">
                  <input name="option_name" maxLength={60} className={inputClass} />
                </Field>
                <Field label="Choices" hint="Comma-separated, e.g. Lemon, Lavender.">
                  <input name="option_values" maxLength={600} className={inputClass} />
                </Field>
              </div>
            </div>
          </Card>
        )}

        {!isVariable && (
          <Card title={isNew ? "Price and stock" : "Pricing"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (LKR)" hint={isNew ? "For products with options, every option starts at this price." : undefined}>
                <input name="regular_price" inputMode="decimal" defaultValue={product?.regular_price ?? ""} placeholder="0.00" className={inputClass} />
              </Field>
              <Field label="Sale price (LKR)" hint="Leave empty for no sale.">
                <input name="sale_price" inputMode="decimal" defaultValue={product?.sale_price ?? ""} placeholder="—" className={inputClass} />
              </Field>
            </div>
          </Card>
        )}

        {!isVariable && (
          <Card title="Inventory">
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="manage_stock" defaultChecked={product ? product.manage_stock : true} /> Track stock quantity
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Quantity" hint="Goes down automatically with each order.">
                  <input name="stock_quantity" inputMode="numeric" defaultValue={product?.stock_quantity ?? ""} className={inputClass} />
                </Field>
                <Field label="Availability" hint="Used when tracking is off.">
                  <select name="stock_status" defaultValue={product?.stock_status === "outofstock" ? "outofstock" : "instock"} className={inputClass}>
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
            <select name="status" defaultValue={product?.status ?? "draft"} className={inputClass} aria-label="Status">
              <option value="publish">Published — visible on the website</option>
              <option value="draft">Draft — hidden</option>
              <option value="private">Private — hidden</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} /> Featured on the homepage
            </label>
            <AdminButton>{isNew ? "Create product" : "Save product"}</AdminButton>
          </div>
        </Card>
        <Card title="Organisation">
          <div className="flex flex-col gap-4">
            <Field label="SKU" hint="Your product code. Must be unique.">
              <input name="sku" defaultValue={product?.sku ?? ""} maxLength={60} className={inputClass} />
            </Field>
            <fieldset className="text-sm">
              <legend className="mb-1.5 font-medium">Categories</legend>
              {categories.length === 0 ? (
                <p className="text-xs text-ink-muted">No categories yet.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {categories
                    .filter((c) => c.slug !== "uncategorized")
                    .map((c) => (
                      <li key={c.id}>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name="categories" value={c.id} defaultChecked={selected.has(c.id)} /> {decodeEntities(c.name)}
                        </label>
                      </li>
                    ))}
                </ul>
              )}
            </fieldset>
          </div>
        </Card>
        {product && (
          <Card title="Details">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Units sold</dt>
                <dd className="tabular-nums">{product.total_sales}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Web address</dt>
                <dd className="truncate">/product/{product.slug}</dd>
              </div>
            </dl>
          </Card>
        )}
      </div>
    </form>
  );
}
