import type { Metadata } from "next";
import { ContentPageView } from "@/components/content/content-page";
import { ButtonLink } from "@/components/ui/button";
import { forBusinesses } from "@/content/pages";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: forBusinesses.title,
  description: forBusinesses.description,
  alternates: { canonical: "/for-businesses" },
};

export default function ForBusinessesPage() {
  return (
    <ContentPageView page={forBusinesses} href="/for-businesses">
      <div className="mt-14 flex flex-wrap gap-3">
        <ButtonLink href={site.contact.phoneHref}>Call {site.contact.phone}</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Contact details
        </ButtonLink>
      </div>
    </ContentPageView>
  );
}
