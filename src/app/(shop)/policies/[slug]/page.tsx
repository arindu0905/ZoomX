import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentPageView } from "@/components/content/content-page";
import { contentMetadata } from "@/components/content/content-metadata";
import { getContentPage, POLICY_SLUGS } from "@/services/wordpress/pages";

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!POLICY_SLUGS.includes(slug)) return {};
  return contentMetadata(slug, `/policies/${slug}`);
}

/** params are awaited inside Suspense so the route's shared shell can prerender (Cache Components). */
export default function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  return (
    <Suspense fallback={null}>
      <Policy params={params} />
    </Suspense>
  );
}

async function Policy({ params }: Pick<PageProps<"/policies/[slug]">, "params">) {
  const { slug } = await params;
  const page = POLICY_SLUGS.includes(slug) ? await getContentPage(slug) : null;
  if (!page) notFound();
  return <ContentPageView page={page} href={`/policies/${page.slug}`} />;
}
