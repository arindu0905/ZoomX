import "server-only";
import catalogue from "../../../sandbox/catalogue/products.json";
import { PAGE_SIZE, type CatalogQuery } from "@/lib/catalog-query";
import type { StoreCategory, StoreImage, StoreProduct, StoreProductDetail } from "@/types/store-api";

/**
 * PREVIEW CATALOGUE — used only when no WooCommerce store is configured
 * (WOOCOMMERCE_STORE_URL unset, e.g. a Vercel preview before the real store
 * is hosted). Shows the real ZOOM X range — names, sizes, copy and packshots
 * from zoomx.lk (sandbox/catalogue) — so the design can be reviewed online.
 *
 * zoomx.lk publishes no prices or stock, so none are invented here: prices
 * are empty (rendered as "Price coming soon") and nothing is purchasable.
 * As soon as WOOCOMMERCE_STORE_URL is set, the live store replaces all of this.
 */

type Entry = (typeof catalogue.products)[number] & {
  variations?: { attribute: string; options: { value: string; image?: string; features?: string[] }[] };
};

const img = (file: string, id: number, alt: string): StoreImage => ({
  id,
  src: `/catalogue/${file}`,
  thumbnail: `/catalogue/${file}`,
  alt,
});

const NO_PRICE = {
  price: "",
  regular_price: "",
  sale_price: "",
  currency_code: "LKR",
  currency_minor_unit: 2,
  price_range: null,
};

export const PREVIEW_AVAILABILITY = "Online ordering opens soon";

const categories: StoreCategory[] = catalogue.categories.map((c, i) => {
  const first = (catalogue.products as Entry[]).find((p) => p.category === c.slug);
  return {
    id: 1000 + i,
    name: c.name,
    slug: c.slug,
    description: c.description,
    parent: 0,
    count: (catalogue.products as Entry[]).filter((p) => p.category === c.slug).length,
    image: first ? img(first.images[0], 5000 + i, "") : null,
  };
});

const details: StoreProductDetail[] = (catalogue.products as Entry[]).map((p, i) => {
  const cat = categories.find((c) => c.slug === p.category);
  const features = p.features ?? p.variations?.options.flatMap((o) => o.features ?? []) ?? [];
  const description = [
    p.tagline && `<p>${p.tagline}.</p>`,
    features.length && `<ul>${features.map((f) => `<li>${f}</li>`).join("")}</ul>`,
    p.idealFor && `<p>Ideal for: ${p.idealFor}.</p>`,
    p.safety && `<p>${p.safety}</p>`,
  ]
    .filter(Boolean)
    .join("");
  const extraImages = p.variations?.options.map((o) => o.image).filter((f): f is string => !!f) ?? [];
  const files = [...new Set([...p.images, ...extraImages])];
  return {
    id: 100 + i,
    name: p.name,
    slug: p.slug,
    type: "simple",
    short_description: `<p>${p.size} · ${features[0] ?? p.tagline}.</p>`,
    description,
    on_sale: false,
    prices: NO_PRICE,
    images: files.map((f, n) => img(f, (100 + i) * 10 + n, n === 0 ? p.name : "")),
    categories: cat ? [{ id: cat.id, name: cat.name, slug: cat.slug }] : [],
    is_in_stock: true,
    is_purchasable: false,
    has_options: false,
    average_rating: "0",
    review_count: 0,
    sku: "",
    low_stock_remaining: null,
    stock_availability: { text: PREVIEW_AVAILABILITY, class: "in-stock" },
    attributes: [],
    variations: [],
    add_to_cart: { minimum: 1, maximum: 1, multiple_of: 1 },
    weight: "",
    formatted_weight: "",
    formatted_dimensions: p.size ?? "",
  };
});

const featuredSlugs = new Set((catalogue.products as Entry[]).filter((p) => p.featured).map((p) => p.slug));
const products: StoreProduct[] = details;

export const preview = {
  categories: () => categories,
  featured: (limit: number) => products.filter((p) => featuredSlugs.has(p.slug)).slice(0, limit),
  bestSellers: (limit: number) => products.slice(0, limit),
  bySlug: (slug: string) => details.find((p) => p.slug === slug) ?? null,
  category: (slug: string) => categories.find((c) => c.slug === slug) ?? null,
  related: (product: StoreProduct, limit: number) => {
    const cat = product.categories[0]?.slug;
    return products.filter((p) => p.id !== product.id && (!cat || p.categories[0]?.slug === cat)).slice(0, limit);
  },
  search: (term: string, limit: number) => {
    const t = term.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(t)).slice(0, limit);
  },
  page: (q: CatalogQuery) => {
    let list = products;
    if (q.category) list = list.filter((p) => p.categories.some((c) => c.slug === q.category));
    if (q.search) {
      const t = q.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(t));
    }
    if (q.sort === "newest") list = [...list].reverse();
    const total = list.length;
    const start = (q.page - 1) * PAGE_SIZE;
    return { items: list.slice(start, start + PAGE_SIZE), total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
  },
  slugs: () => products.map((p) => ({ slug: p.slug })),
};
