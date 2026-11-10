import type { Metadata } from "next";
import { ContentPageView } from "@/components/content/content-page";
import { sustainability } from "@/content/pages";

export const metadata: Metadata = {
  title: sustainability.title,
  description: sustainability.description,
  alternates: { canonical: "/sustainability" },
};

export default function SustainabilityPage() {
  return <ContentPageView page={sustainability} href="/sustainability" />;
}
