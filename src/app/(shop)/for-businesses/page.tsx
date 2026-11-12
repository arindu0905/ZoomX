import type { Metadata } from "next";
import { ContentPageView } from "@/components/content/content-page";
import { contentMetadata } from "@/components/content/content-metadata";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";
import { getContentPage } from "@/services/wordpress/pages";

export const generateMetadata = (): Promise<Metadata> => contentMetadata("for-businesses", "/for-businesses");

export default async function ForBusinessesPage() {
  const page = (await getContentPage("for-businesses"))!;
  return (
    <ContentPageView page={page} href="/for-businesses">
      <div className="mt-14 flex flex-wrap gap-3">
        <ButtonLink href={site.contact.phoneHref}>Call {site.contact.phone}</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Contact details
        </ButtonLink>
      </div>
    </ContentPageView>
  );
}
