#!/usr/bin/env node
/**
 * Builds a WooCommerce product-import CSV (Products → Import) from the real
 * ZOOM X range in sandbox/catalogue/products.json.
 *
 *   node scripts/catalogue-csv.mjs            → docs/zoomx-products-import.csv
 *
 * Prices, SKUs and stock are LEFT BLANK on purpose: zoomx.lk publishes none,
 * and the storefront never invents them. Fill them in (in the CSV or in
 * WooCommerce) before publishing. Images point at the existing zoomx.lk media
 * so the importer can fetch them.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const { categories, products } = JSON.parse(readFileSync(`${root}sandbox/catalogue/products.json`, "utf8"));
const categoryName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

const esc = (s) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const description = (p, features = p.features) =>
  `<p>${esc(p.tagline)}.</p><p>Key features:</p><ul>${features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` +
  `<p>Ideal for: ${esc(p.idealFor)}.</p><p>${esc(p.safety)}</p>`;

const columns = [
  "Type", "SKU", "Parent", "Name", "Slug", "Published", "Is featured?", "Visibility in catalog",
  "Short description", "Description", "In stock?", "Stock", "Regular price", "Sale price",
  "Categories", "Images", "Attribute 1 name", "Attribute 1 value(s)", "Attribute 1 visible",
  "Attribute 1 global", "Attribute 2 name", "Attribute 2 value(s)", "Attribute 2 visible", "Attribute 2 global",
];
const rows = [];
const row = (r) => rows.push(columns.map((c) => r[c] ?? ""));

for (const p of products) {
  const sourceImage = (file) => p.sourceImages[p.images.indexOf(file)];
  const base = {
    Name: p.name,
    Slug: p.slug,
    Published: 0, // draft until prices are set
    "Is featured?": p.featured ? 1 : 0,
    "Visibility in catalog": "visible",
    "Short description": `<p>${esc(p.size)} · ${esc(p.features[0])}.</p>`,
    Description: description(p),
    Categories: categoryName[p.category],
    Images: p.sourceImages.join(", "),
    "Attribute 1 name": "Size",
    "Attribute 1 value(s)": p.size,
    "Attribute 1 visible": 1,
    "Attribute 1 global": 0,
  };
  if (!p.variations) {
    row({ ...base, Type: "simple", "In stock?": 1 });
    continue;
  }
  const v = p.variations;
  // The importer links variations to their parent by SKU. This temporary SKU
  // (the slug) can be replaced with the real one after import.
  row({
    ...base,
    Type: "variable",
    SKU: p.slug,
    "Attribute 2 name": v.attribute,
    "Attribute 2 value(s)": v.options.map((o) => o.value).join(", "),
    "Attribute 2 visible": 1,
    "Attribute 2 global": 0,
  });
  for (const o of v.options) {
    row({
      Type: "variation",
      Parent: p.slug,
      Name: `${p.name} - ${o.value}`,
      Published: 1,
      "In stock?": 1,
      Images: sourceImage(o.image),
      "Attribute 1 name": v.attribute,
      "Attribute 1 value(s)": o.value,
      "Attribute 1 global": 0,
    });
  }
}

const cell = (v) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [columns, ...rows].map((r) => r.map(cell).join(",")).join("\n") + "\n";
const out = `${root}docs/zoomx-products-import.csv`;
writeFileSync(out, csv);
console.log(`Wrote ${rows.length} rows to docs/zoomx-products-import.csv (prices/SKUs/stock blank — fill before publishing).`);
