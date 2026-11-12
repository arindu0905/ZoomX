import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { about, faqs, forBusinesses, policies, sustainability, type ContentPage, type ContentSection } from "@/content/pages";
import { getServerEnv } from "@/lib/env";
import { CONTENT_TAG } from "./content";

/** Built-in pages, keyed by slug. WordPress may override any of them. */
export const DEFAULT_PAGES: Record<string, ContentPage> = {
  about,
  sustainability,
  "for-businesses": forBusinesses,
  faqs,
  ...policies,
};

/** Policy slugs (served under /policies/[slug]). */
export const POLICY_SLUGS = Object.keys(policies);

/**
 * Simple text format the ZOOM X team edits in WordPress:
 *   "## Heading" starts a section, "- item" is a bullet, blank lines
 *   separate paragraphs. Plain text only — never rendered as HTML.
 */
export function sectionsToText(sections: ContentSection[]): string {
  return sections
    .map((s) =>
      [
        s.heading ? `## ${s.heading}` : null,
        ...(s.paragraphs ?? []),
        s.bullets?.length ? s.bullets.map((b) => `- ${b}`).join("\n") : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
    )
    .join("\n\n");
}

export function textToSections(text: string): ContentSection[] {
  const sections: ContentSection[] = [];
  let current: ContentSection = {};
  const push = () => {
    if (current.heading || current.paragraphs?.length || current.bullets?.length) sections.push(current);
  };
  // Within a block, consecutive plain lines form one paragraph.
  for (const block of text.replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    let para: string[] = [];
    const flush = () => {
      if (para.length) (current.paragraphs ??= []).push(para.join(" "));
      para = [];
    };
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("## ")) {
        flush();
        push();
        current = { heading: line.slice(3).trim() };
      } else if (/^[-*•] /.test(line)) {
        flush();
        (current.bullets ??= []).push(line.slice(2).trim());
      } else {
        para.push(line);
      }
    }
    flush();
  }
  push();
  return sections;
}

const field = z.string().trim().min(1).max(20000);
const remotePageSchema = z
  .object({
    title: field.max(200),
    description: field.max(300),
    eyebrow: field.max(200),
    lead: field.max(300),
    status: z.enum(["draft", "approved"]),
    body: field,
  })
  .partial();
const remotePagesSchema = z.union([z.record(z.string(), remotePageSchema), z.array(z.never()).transform(() => ({}))]);

export type RemotePage = z.infer<typeof remotePageSchema>;

/** Overlays a WordPress edit on the built-in page. Pure, so it is unit-tested. */
export function mergePage(base: ContentPage, remote: RemotePage | undefined): ContentPage {
  if (!remote) return base;
  const sections = remote.body ? textToSections(remote.body) : [];
  return {
    ...base,
    title: remote.title ?? base.title,
    description: remote.description ?? base.description,
    eyebrow: remote.eyebrow ?? base.eyebrow,
    lead: remote.lead ?? base.lead,
    status: remote.status ? (remote.status === "approved" ? "approved-copy" : "draft") : base.status,
    sections: sections.length ? sections : base.sections,
  };
}

async function fetchRemotePages(): Promise<Record<string, RemotePage>> {
  const { WOOCOMMERCE_STORE_URL, WOOCOMMERCE_REQUEST_TIMEOUT_MS } = getServerEnv();
  if (!WOOCOMMERCE_STORE_URL) return {};
  try {
    const res = await fetch(new URL("/wp-json/zoomx/v1/pages", WOOCOMMERCE_STORE_URL), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(WOOCOMMERCE_REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = remotePagesSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error("unexpected pages shape");
    return parsed.data;
  } catch (err) {
    console.warn("[content] pages:", err instanceof Error ? err.message : "unknown error");
    return {};
  }
}

/** Every content page, WordPress edits merged over the built-in copy. Refreshed on save. */
export async function getContentPages(): Promise<Record<string, ContentPage>> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const remote = await fetchRemotePages();
  return Object.fromEntries(Object.entries(DEFAULT_PAGES).map(([slug, page]) => [slug, mergePage(page, remote[slug])]));
}

export async function getContentPage(slug: string): Promise<ContentPage | null> {
  return (await getContentPages())[slug] ?? null;
}
