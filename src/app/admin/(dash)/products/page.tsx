import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { adminMoney } from "@/components/admin/format";
import { AdminLinkButton, Badge, EmptyRow, inputClass, PageHeader, Pager, SearchParamsNotice, TableCard } from "@/components/admin/ui";
import { requireStaff } from "@/services/admin/session";
import { listProducts } from "@/services/admin/woo";
import { decodeEntities } from "@/utils/text";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const [, sp] = await Promise.all([requireStaff(), searchParams]);
  const search = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const stock = sp.stock === "outofstock" || sp.stock === "instock" ? sp.stock : "";
  const category = typeof sp.category === "string" && /^\d+$/.test(sp.category) ? sp.category : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { data: products, total, totalPages } = await listProducts({ page, search, stock, category });

  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries({ q: search, stock, category, page: p > 1 ? String(p) : "" }).filter(([, v]) => v));
    return `/admin/products${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Products"
        actions={
          <AdminLinkButton href="/admin/products/new" variant="primary">
            Add product
          </AdminLinkButton>
        }
      />
      <SearchParamsNotice sp={sp} />
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="product-search">
          Search products
        </label>
        <input id="product-search" name="q" defaultValue={search} placeholder="Search products" className={`${inputClass} min-w-0 flex-1 sm:w-64 sm:flex-none`} />
        <label className="sr-only" htmlFor="stock">
          Stock
        </label>
        <select id="stock" name="stock" defaultValue={stock} className={inputClass.replace("w-full", "w-auto")}>
          <option value="">All stock</option>
          <option value="instock">In stock</option>
          <option value="outofstock">Out of stock</option>
        </select>
        <button type="submit" className="rounded-lg bg-canvas px-4 text-sm font-semibold shadow-[inset_0_0_0_1px_var(--color-line)]">
          Filter
        </button>
        <span className="ml-auto self-center text-sm text-ink-muted">{total} products</span>
      </form>
      <TableCard>
        <thead>
          <tr>
            <th className="w-14">
              <span className="sr-only">Image</span>
            </th>
            <th>Product</th>
            <th>Status</th>
            <th>Stock</th>
            <th>Category</th>
            <th className="text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 && <EmptyRow cols={6}>No products found.</EmptyRow>}
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-canvas-alt/60">
              <td>
                <span className="relative block size-10 overflow-hidden rounded-lg bg-canvas-alt">
                  {p.images[0] && <Image src={p.images[0].src} alt="" fill sizes="40px" className="object-contain p-0.5" />}
                </span>
              </td>
              <td>
                <Link href={`/admin/products/${p.id}`} className="font-semibold hover:underline">
                  {decodeEntities(p.name)}
                </Link>
                {p.sku && <span className="block text-xs text-ink-muted">{p.sku}</span>}
              </td>
              <td>
                <Badge status={p.status} />
              </td>
              <td className="whitespace-nowrap">
                {p.type === "variable" ? (
                  <span className="text-ink-muted">{p.variations.length} options</span>
                ) : p.manage_stock ? (
                  <span className={p.stock_status === "outofstock" ? "text-danger" : undefined}>{p.stock_quantity ?? 0} in stock</span>
                ) : (
                  <Badge status={p.stock_status} />
                )}
              </td>
              <td className="text-ink-muted">{p.categories.map((c) => decodeEntities(c.name)).join(", ")}</td>
              <td className="text-right whitespace-nowrap tabular-nums">
                {p.type === "variable" ? `From ${adminMoney(p.price)}` : p.price ? adminMoney(p.price) : <span className="text-ink-muted">No price</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      <Pager page={page} totalPages={totalPages} href={href} />
    </>
  );
}
