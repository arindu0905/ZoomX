import type { MetadataRoute } from "next";
import { productHref } from "@/components/products/product-card";
import { categoryHref } from "@/lib/navigation";
import { siteUrl } from "@/lib/site";
import { getAllProductSlugs, getCategories } from "@/services/woocommerce/catalog";
import { getContentPages, POLICY_SLUGS } from "@/services/wordpress/pages";

/**
 * XML sitemap: indexable pages only. Draft policy pages, the FAQ draft and
 * private routes (bag, checkout, account, orders) are excluded. Catalogue
 * entries come from WooCommerce and refresh with the `products`/`categories`
 * cache tags.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => new URL(path, siteUrl).toString();
  const [categories, products, pages] = await Promise.all([getCategories(), getAllProductSlugs(), getContentPages()]);

  // Content pages approved in WordPress (ZOOM X → Pages); drafts stay out.
  const approved = (slug: string) => pages[slug]?.status !== "draft";
  const approvedPolicies = POLICY_SLUGS.filter(approved).map((s) => `/policies/${s}`);
  const approvedPages = ["about", "sustainability", "for-businesses", "faqs"].filter(approved).map((s) => `/${s}`);

  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/shop"), changeFrequency: "daily", priority: 0.9 },
    ...[...approvedPages, "/contact", ...approvedPolicies].map((p) => ({
      url: url(p),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...categories.map((c) => ({ url: url(categoryHref(c.slug)), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: url(productHref(p.slug)), changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
