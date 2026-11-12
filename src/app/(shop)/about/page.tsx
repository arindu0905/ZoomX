import type { Metadata } from "next";
import { ContentPageView } from "@/components/content/content-page";
import { ButtonLink } from "@/components/ui/button";
import { contentMetadata } from "@/components/content/content-metadata";
import { getContentPage } from "@/services/wordpress/pages";

export const generateMetadata = (): Promise<Metadata> => contentMetadata("about", "/about");

export default async function AboutPage() {
  const page = (await getContentPage("about"))!;
  return (
    <ContentPageView page={page} href="/about">
      <div className="mt-14 flex flex-wrap gap-3">
        <ButtonLink href="/shop">Shop the range</ButtonLink>
        <ButtonLink href="/sustainability" variant="secondary">
          Sustainability
        </ButtonLink>
      </div>
    </ContentPageView>
  );
}
