import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Private and transactional routes are not for crawling. */
export default function robots(): MetadataRoute.Robots {
  const isProduction = siteUrl.startsWith("https://") && !/vercel\.app|localhost/.test(siteUrl);
  return {
    rules: isProduction
      ? { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/cart", "/checkout", "/account", "/orders/"] }
      : // Preview/staging deployments must never be indexed.
        { userAgent: "*", disallow: "/" },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
