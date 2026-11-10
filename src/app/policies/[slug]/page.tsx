import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentPageView } from "@/components/content/content-page";
import { policies } from "@/content/pages";

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const page = policies[(await params).slug];
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/policies/${page.slug}` },
    // Drafts stay out of search results until approved.
    robots: page.status === "draft" ? { index: false, follow: true } : undefined,
  };
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
  const page = policies[(await params).slug];
  if (!page) notFound();
  return <ContentPageView page={page} href={`/policies/${page.slug}`} />;
}
