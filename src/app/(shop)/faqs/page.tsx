import type { Metadata } from "next";
import { ContentPageView } from "@/components/content/content-page";
import { contentMetadata } from "@/components/content/content-metadata";
import { getContentPage } from "@/services/wordpress/pages";

// noindex while the page is a draft (set "Approved" in ZOOM X → Pages).
export const generateMetadata = (): Promise<Metadata> => contentMetadata("faqs", "/faqs");

export default async function FaqsPage() {
  const page = (await getContentPage("faqs"))!;
  return <ContentPageView page={page} href="/faqs" />;
}
