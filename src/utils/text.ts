const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
};

/**
 * Decodes HTML entities in WooCommerce text fields (e.g. product names like
 * "Dish Wash &#8211; 500ml") into plain text. Output is rendered as text by
 * React, so no markup from the backend ever reaches the DOM.
 */
export function decodeEntities(input: string): string {
  return input.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return NAMED[code.toLowerCase()] ?? match;
  });
}

/** Strips tags and decodes entities from short WooCommerce HTML (descriptions) for plain-text use. */
export function htmlToText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits WooCommerce HTML into plain-text paragraphs (on block tags and line
 * breaks) so long descriptions keep their structure without rendering
 * backend markup. Lists become one paragraph per item.
 */
export function htmlToParagraphs(html: string): string[] {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .split(/<\/?(?:p|div|br|li|ul|ol|h[1-6]|blockquote|tr)\b[^>]*>|\r?\n\s*\r?\n/gi)
    .map(htmlToText)
    .filter(Boolean);
}
