import type { Metadata } from "next";
import { ContentPageView } from "@/components/content/content-page";
import { contentMetadata } from "@/components/content/content-metadata";
import { getContentPage } from "@/services/wordpress/pages";

export const generateMetadata = (): Promise<Metadata> => contentMetadata("sustainability", "/sustainability");

export default async function SustainabilityPage() {
  const page = (await getContentPage("sustainability"))!;
  return <ContentPageView page={page} href="/sustainability" />;
}
