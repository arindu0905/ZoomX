import type { Metadata } from "next";
import { getContentPage } from "@/services/wordpress/pages";

/** Title, description, canonical and draft noindex for an editable content page. */
export async function contentMetadata(slug: string, href: string): Promise<Metadata> {
  const page = await getContentPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: href },
    // Drafts stay out of search results until approved (ZOOM X → Pages → Status).
    robots: page.status === "draft" ? { index: false, follow: true } : undefined,
  };
}
