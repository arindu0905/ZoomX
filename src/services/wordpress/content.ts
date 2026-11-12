import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { business, hero, story, why } from "@/content/home";
import { getServerEnv } from "@/lib/env";
import { site, type Announcement } from "@/lib/site";

/** Cache tag refreshed by WordPress on save (POST /api/content/refresh). */
export const CONTENT_TAG = "content";

const link = z.object({
  label: z.string().min(1).max(200),
  // Site paths or http(s) URLs only (also enforced by the WordPress plugin).
  href: z.string().regex(/^(\/(?!\/)\S*|https?:\/\/\S+)$/),
});
const text = z.string().min(1).max(2000);
const pair = z.object({ title: text, body: text });

/**
 * Payload of GET /wp-json/zoomx/v1/content (ZOOM X → Site content).
 * Every field is optional: anything missing keeps the built-in copy.
 * PHP serialises an empty array as [], so empty sections accept that too.
 */
const section = <T extends z.ZodRawShape>(shape: T) =>
  z.union([z.object(shape).partial(), z.array(z.never()).transform(() => ({}))]).optional();

const contentSchema = z.object({
  announcement: z
    .union([z.literal(false), z.object({ message: text, link: link.optional() })])
    .nullable()
    .optional(),
  hero: section({ eyebrow: text, title: text, lead: text, primary: link, secondary: link }),
  business: section({ eyebrow: text, title: text, lead: text, points: z.array(text).max(10), cta: link }),
  story: section({
    eyebrow: text,
    title: text,
    paragraphs: z.array(text).max(10),
    values: z.array(pair).max(4),
    cta: link,
  }),
  why: section({ eyebrow: text, title: text, items: z.array(pair).max(4) }),
});

export type RemoteContent = z.infer<typeof contentSchema>;

export interface SiteContent {
  announcement: Announcement | null;
  hero: typeof hero;
  business: typeof business;
  story: typeof story;
  why: typeof why;
}

export const DEFAULT_CONTENT: SiteContent = { announcement: site.announcement, hero, business, story, why };

/** Overlays edited fields on the built-in copy. Pure, so it is unit-tested. */
export function mergeContent(remote: RemoteContent | null, base: SiteContent = DEFAULT_CONTENT): SiteContent {
  if (!remote) return base;
  const announcement =
    remote.announcement === false ? null : remote.announcement ? remote.announcement : base.announcement;
  return {
    announcement,
    hero: { ...base.hero, ...remote.hero },
    business: { ...base.business, ...remote.business },
    story: { ...base.story, ...remote.story },
    why: { ...base.why, ...remote.why },
  };
}

/** Cached on success only: a thrown error is not cached, so an outage is retried on the next request. */
async function fetchRemote(): Promise<RemoteContent | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  const { WOOCOMMERCE_STORE_URL, WOOCOMMERCE_REQUEST_TIMEOUT_MS } = getServerEnv();
  if (!WOOCOMMERCE_STORE_URL) return null;
  const res = await fetch(new URL("/wp-json/zoomx/v1/content", WOOCOMMERCE_STORE_URL), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(WOOCOMMERCE_REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const parsed = contentSchema.safeParse(await res.json());
  if (!parsed.success) throw new Error("unexpected content shape");
  return parsed.data;
}

/**
 * Editable site copy from WordPress (ZOOM X → Site content), merged over the
 * built-in text. Cached for hours and refreshed instantly when WordPress
 * saves; on any error the built-in copy is used.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const remote = await fetchRemote().catch((err: unknown) => {
    console.warn("[content] site content:", err instanceof Error ? err.message : "unknown error");
    return null;
  });
  return mergeContent(remote);
}
