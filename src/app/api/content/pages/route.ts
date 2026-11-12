import { NextResponse } from "next/server";
import { DEFAULT_PAGES, sectionsToText } from "@/services/wordpress/pages";

/**
 * The built-in text of every content page, in the editing format used by
 * WordPress (ZOOM X → Pages). WordPress pre-fills its editor with this so
 * the team edits the current wording instead of starting from blank.
 * Public: it is the same text the site already shows.
 */
export function GET() {
  const pages = Object.fromEntries(
    Object.entries(DEFAULT_PAGES).map(([slug, p]) => [
      slug,
      {
        title: p.title,
        description: p.description,
        eyebrow: p.eyebrow ?? "",
        lead: p.lead ?? "",
        status: p.status === "draft" ? "draft" : "approved",
        body: sectionsToText(p.sections),
      },
    ]),
  );
  return NextResponse.json(pages);
}
