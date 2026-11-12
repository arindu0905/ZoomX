import { describe, expect, it } from "vitest";
import { DEFAULT_PAGES, mergePage, sectionsToText, textToSections } from "@/services/wordpress/pages";

describe("page text format", () => {
  it("round-trips every built-in page without changes", () => {
    for (const page of Object.values(DEFAULT_PAGES)) {
      expect(textToSections(sectionsToText(page.sections))).toEqual(page.sections);
    }
  });

  it("parses headings, paragraphs and bullets", () => {
    const text = "Intro line\n\n## Delivery\nWe deliver island-wide.\nWrapped on two lines.\n\n- Colombo\n- Kandy\n\n## Contact\nCall us.";
    expect(textToSections(text)).toEqual([
      { paragraphs: ["Intro line"] },
      { heading: "Delivery", paragraphs: ["We deliver island-wide. Wrapped on two lines."], bullets: ["Colombo", "Kandy"] },
      { heading: "Contact", paragraphs: ["Call us."] },
    ]);
  });

  it("treats Windows line endings and stray spaces the same", () => {
    expect(textToSections("## A\r\n\r\n  one  \r\n\r\n- b")).toEqual([{ heading: "A", paragraphs: ["one"], bullets: ["b"] }]);
  });
});

describe("mergePage", () => {
  const base = DEFAULT_PAGES.delivery;

  it("keeps the built-in page when nothing was edited", () => {
    expect(mergePage(base, undefined)).toBe(base);
    expect(mergePage(base, {})).toEqual(base);
  });

  it("applies edited fields, body and approval", () => {
    const merged = mergePage(base, { title: "Delivery", status: "approved", body: "## Where\nAll of Sri Lanka." });
    expect(merged.title).toBe("Delivery");
    expect(merged.status).toBe("approved-copy");
    expect(merged.sections).toEqual([{ heading: "Where", paragraphs: ["All of Sri Lanka."] }]);
    expect(merged.description).toBe(base.description);
    expect(merged.slug).toBe("delivery");
  });
});
