import type { Metadata } from "next";
import { ContentPageView } from "@/components/content/content-page";
import { faqs } from "@/content/pages";

export const metadata: Metadata = {
  title: faqs.title,
  description: faqs.description,
  alternates: { canonical: "/faqs" },
  // Draft until approved by ZOOM X.
  robots: { index: false, follow: true },
};

export default function FaqsPage() {
  return <ContentPageView page={faqs} href="/faqs" />;
}
