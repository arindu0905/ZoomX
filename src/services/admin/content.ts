import "server-only";
import { z } from "zod";
import { wpSignedCall } from "@/services/auth/wordpress-auth";

/**
 * Editable homepage fields, mirroring zoomx_content_schema() in the
 * WordPress plugin (includes/content.php). The plugin sanitises again.
 */
export type ContentFieldType = "text" | "textarea" | "lines" | "link" | "checkbox";
export interface ContentSectionDef {
  key: string;
  title: string;
  help?: string;
  fields: { key: string; label: string; type: ContentFieldType; help?: string }[];
}

const pairs = (prefix: string, label: string) =>
  [1, 2, 3, 4].flatMap((i) => [
    { key: `${prefix}_${i}_title`, label: `${label} ${i} — title`, type: "text" as const },
    { key: `${prefix}_${i}_body`, label: `${label} ${i} — text`, type: "textarea" as const },
  ]);

export const CONTENT_SECTIONS: ContentSectionDef[] = [
  {
    key: "announcement",
    title: "Announcement bar",
    help: "The strip above the menu. Leave the message empty to keep the standard text.",
    fields: [
      { key: "hide", label: "Hide the bar", type: "checkbox" },
      { key: "message", label: "Message", type: "text", help: "Only what the business has confirmed." },
      { key: "link_label", label: "Link text", type: "text" },
      { key: "link_href", label: "Link address", type: "link", help: "A site path like /shop, or https://…" },
    ],
  },
  {
    key: "hero",
    title: "Homepage — top banner",
    fields: [
      { key: "eyebrow", label: "Small line above the headline", type: "text" },
      { key: "title", label: "Headline", type: "text" },
      { key: "lead", label: "Intro sentence", type: "textarea" },
      { key: "primary_label", label: "Main button text", type: "text" },
      { key: "primary_href", label: "Main button link", type: "link" },
      { key: "secondary_label", label: "Second button text", type: "text" },
      { key: "secondary_href", label: "Second button link", type: "link" },
    ],
  },
  {
    key: "business",
    title: "Homepage — For businesses",
    fields: [
      { key: "eyebrow", label: "Small line above the heading", type: "text" },
      { key: "title", label: "Heading", type: "text" },
      { key: "lead", label: "Text", type: "textarea" },
      { key: "points", label: "Ticked points", type: "lines", help: "One point per line." },
      { key: "cta_label", label: "Button text", type: "text" },
      { key: "cta_href", label: "Button link", type: "link" },
    ],
  },
  {
    key: "story",
    title: "Homepage — Our story",
    fields: [
      { key: "eyebrow", label: "Small line above the heading", type: "text" },
      { key: "title", label: "Heading", type: "text" },
      { key: "paragraphs", label: "Paragraphs", type: "lines", help: "One paragraph per line." },
      { key: "cta_label", label: "Link text", type: "text" },
      { key: "cta_href", label: "Link address", type: "link" },
      ...pairs("value", "Value"),
    ],
  },
  {
    key: "why",
    title: "Homepage — Why ZOOM X",
    fields: [
      { key: "eyebrow", label: "Small line above the heading", type: "text" },
      { key: "title", label: "Heading", type: "text" },
      ...pairs("item", "Reason"),
    ],
  },
];

const rawSchema = z.union([
  z.record(z.string(), z.record(z.string(), z.string())),
  z.array(z.never()).transform(() => ({})),
]);
export type RawContent = Record<string, Record<string, string>>;

export const getRawContent = (): Promise<RawContent> => wpSignedCall("admin/content-raw", {}, rawSchema);

export const saveRawContent = (content: RawContent) => wpSignedCall("admin/content", { content }, z.unknown());

export const saveRawPage = (slug: string, page: Record<string, string> | null) =>
  wpSignedCall("admin/page", { slug, page }, z.unknown());
