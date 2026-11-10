import { BrandStory } from "@/components/home/brand-story";
import { BusinessCampaign } from "@/components/home/business-campaign";
import { Hero } from "@/components/home/hero";
import { ProductRail } from "@/components/home/product-rail";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { WhyZoomX } from "@/components/home/why-zoomx";
import { site, siteUrl } from "@/lib/site";
import { jsonLdString, organizationJsonLd } from "@/lib/structured-data";
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
export default async function Home() {
  const [categories, bestSellers, featured] = await Promise.all([
    getCategories(),
    getBestSellers(),
    getFeaturedProducts(),
  ]);

  return (
    <>
      <Hero />
      <ShopByCategory categories={categories} />
      <ProductRail id="best-sellers" eyebrow="Best sellers" title="Our most popular products." products={bestSellers} />
      <BusinessCampaign />
      <BrandStory />
      <ProductRail id="featured" eyebrow="Featured" title="Picked for you." products={featured} tone="alt" />
      <WhyZoomX />
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
