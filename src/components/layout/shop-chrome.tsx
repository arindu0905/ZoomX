import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { NavCategory } from "@/lib/navigation";
import { getCategories } from "@/services/woocommerce/catalog";
import { getSiteContent } from "@/services/wordpress/content";
import { decodeEntities } from "@/utils/text";

/** Storefront frame: announcement, header, main, footer and the bag drawer. Not used by /admin. */
export async function ShopChrome({ children }: { children: ReactNode }) {
  // Live WooCommerce categories (cached). Empty until the store exists, in
  // which case the navigation offers "All products" only.
  const [content, storeCategories] = await Promise.all([getSiteContent(), getCategories()]);
  const navCategories: NavCategory[] = storeCategories.map((c) => ({
    name: decodeEntities(c.name),
    slug: c.slug,
  }));
  return (
    <>
      <AnnouncementBar announcement={content.announcement} />
      <SiteHeader categories={navCategories} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CartProvider />
    </>
  );
}
