import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { NavCategory } from "@/lib/navigation";
import { site } from "@/lib/site";
import { getCategories } from "@/services/woocommerce/catalog";
import { isStoreConfigured } from "@/services/woocommerce/store-api";
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
      {!isStoreConfigured() && (
        <p className="bg-ink px-gutter py-2 text-center text-caption text-white/85">
          Preview of the new ZOOM X website — online ordering opens soon. Call{" "}
          <a href={site.contact.phoneHref} className="font-semibold text-white underline underline-offset-2">
            {site.contact.phone}
          </a>{" "}
          to order today.
        </p>
      )}
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
