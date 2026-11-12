import { BrandStory } from "@/components/home/brand-story";
import { BusinessCampaign } from "@/components/home/business-campaign";
import { Hero } from "@/components/home/hero";
import { ProductRail } from "@/components/home/product-rail";
import { ProductTiles } from "@/components/home/product-tiles";
import { RangeTicker } from "@/components/home/range-ticker";
import { ScrollShowcase } from "@/components/home/scroll-showcase";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { WhyZoomX } from "@/components/home/why-zoomx";
import { site, siteUrl } from "@/lib/site";
import { jsonLdString, organizationJsonLd } from "@/lib/structured-data";
import { getSiteContent } from "@/services/wordpress/content";
import { getBestSellers, getCategories, getFeaturedProducts } from "@/services/woocommerce/catalog";

/*
 * Homepage sections (spec numbering):
 *  01 Announcement + 02 Navigation + 12 Footer — root layout
 *  03 Hero · 04 Categories · 05 Best sellers · 06 Campaign · 07 Story
 *  08 Featured · 09 Why ZOOM X
 *  10 Testimonials — omitted until verified reviews exist (WooCommerce verified-buyer reviews)
 *  11 Newsletter — omitted until an email provider is chosen (no non-functional forms)
 * Product sections render nothing until WooCommerce returns real products.
 */
const SHOWCASE_COUNT = 5;

export default async function Home() {
  const [content, categories, bestSellers, featured] = await Promise.all([
    getSiteContent(),
    getCategories(),
    getBestSellers(12),
    getFeaturedProducts(),
  ]);
  // apple.com-style tiles: featured products lead as full-width tiles, then
  // best sellers fill the two-up grid (each product shown once).
  const featuredIds = new Set(featured.map((p) => p.id));
  const ordered = [...featured, ...bestSellers.filter((p) => !featuredIds.has(p.id))];
  // The scroll showcase presents the first five; the tiles continue with the
  // rest so no product is shown twice in a row (small catalogues share them).
  const showcase = ordered.slice(0, SHOWCASE_COUNT);
  const rest = ordered.slice(SHOWCASE_COUNT);
  const tiles = (rest.length >= 3 ? rest : ordered).slice(0, 7);

  return (
    <>
      <Hero products={bestSellers} hero={content.hero} />
      <RangeTicker />
      <ScrollShowcase products={showcase} />
      <ProductTiles products={tiles} title="Our most popular products." />
      <ShopByCategory categories={categories} />
      <BusinessCampaign business={content.business} />
      <BrandStory story={content.story} />
      <ProductRail id="all-products" eyebrow="The full range" title="Take a closer look." products={bestSellers.slice(0, 12)} tone="alt" />
      <WhyZoomX why={content.why} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            organizationJsonLd({
              name: site.name,
              legalName: site.legalEntity,
              url: siteUrl,
              logo: new URL("/logo/zoomx-logo.webp", siteUrl).toString(),
              phone: site.contact.phone,
              address: site.contact.office,
              sameAs: Object.values(site.social).filter((v): v is string => !!v),
            }),
          ),
        }}
      />
    </>
  );
}
