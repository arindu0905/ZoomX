import type { Metadata } from "next";
import { ContentPageView } from "@/components/content/content-page";
import { ButtonLink } from "@/components/ui/button";
import { about } from "@/content/pages";

export const metadata: Metadata = {
  title: about.title,
  description: about.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ContentPageView page={about} href="/about">
      <div className="mt-14 flex flex-wrap gap-3">
        <ButtonLink href="/shop">Shop the range</ButtonLink>
        <ButtonLink href="/sustainability" variant="secondary">
          Sustainability
        </ButtonLink>
      </div>
    </ContentPageView>
  );
}
