import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { MotionProvider } from "@/components/layout/motion-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { NavCategory } from "@/lib/navigation";
import { site, siteUrl } from "@/lib/site";
import { getCategories } from "@/services/woocommerce/catalog";
import { decodeEntities } from "@/utils/text";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { siteName: site.name, locale: "en_LK", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Live WooCommerce categories (cached). Empty until the store exists, in
  // which case the navigation offers "All products" only.
  const navCategories: NavCategory[] = (await getCategories()).map((c) => ({
    name: decodeEntities(c.name),
    slug: c.slug,
  }));

  return (
    <html lang="en-LK" className={inter.variable}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <MotionProvider>
          <AnnouncementBar announcement={site.announcement} />
          <SiteHeader categories={navCategories} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
