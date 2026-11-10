import { z } from "zod";

/**
 * Shop/category URL query ⇄ WooCommerce Store API query.
 * Pure (no server imports) so it is shared by pages, the filter UI and tests.
 * Prices in the URL are whole rupees; the Store API expects minor units.
 */

export const SORT_OPTIONS = [
  { value: "default", label: "Featured", orderby: "menu_order", order: "asc" },
  {
    value: "popularity",
    label: "Most popular",
    orderby: "popularity",
    order: "desc",
  },
  { value: "newest", label: "Newest", orderby: "date", order: "desc" },
  {
    value: "price-asc",
    label: "Price: low to high",
    orderby: "price",
    order: "asc",
  },
  {
    value: "price-desc",
    label: "Price: high to low",
    orderby: "price",
    order: "desc",
  },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 12;
const MAX_SEARCH = 100;

const sortValues = SORT_OPTIONS.map((o) => o.value) as [SortValue, ...SortValue[]];

/** Takes the first value of a repeated param; ignores anything malformed. */
const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const rupees = z.preprocess((v) => {
  const s = first(v);
  return typeof s === "string" && s.trim() === "" ? undefined : s;
}, z.coerce.number().int().min(0).max(10_000_000).optional().catch(undefined));

const querySchema = z.object({
  search: z.preprocess(
    first,
    z
      .string()
      .transform((s) => s.trim().slice(0, MAX_SEARCH))
      .optional()
      .catch(undefined),
  ),
  sort: z.preprocess(first, z.enum(sortValues).catch("default")).default("default"),
  min: rupees,
  max: rupees,
  page: z.preprocess(first, z.coerce.number().int().min(1).max(1000).catch(1)).default(1),
  category: z.preprocess(
    first,
    z
      .string()
      .regex(/^[a-z0-9-]{1,100}$/i)
      .optional()
      .catch(undefined),
  ),
});

export interface CatalogQuery {
  search?: string;
  sort: SortValue;
  min?: number;
  max?: number;
  page: number;
  category?: string;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseCatalogQuery(params: RawSearchParams): CatalogQuery {
  const q = querySchema.parse(params);
  const out: CatalogQuery = { sort: q.sort, page: q.page };
  if (q.search) out.search = q.search;
  if (q.category) out.category = q.category;
  // Swap an inverted range rather than returning nothing.
  let { min, max } = q;
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  if (min !== undefined && min > 0) out.min = min;
  if (max !== undefined) out.max = max;
  return out;
}

/** Store API `GET /products` params for a catalogue query. */
export function toStoreApiParams(q: CatalogQuery, minorUnit = 2): Record<string, string | number> {
  const sort = SORT_OPTIONS.find((o) => o.value === q.sort) ?? SORT_OPTIONS[0];
  const scale = 10 ** minorUnit;
  const p: Record<string, string | number> = {
    orderby: sort.orderby,
    order: sort.order,
    page: q.page,
    per_page: PAGE_SIZE,
  };
  if (q.search) p.search = q.search;
  if (q.category) p.category = q.category;
  if (q.min !== undefined) p.min_price = q.min * scale;
  if (q.max !== undefined) p.max_price = q.max * scale;
  return p;
}

/** Builds a canonical query string (omits defaults) — for links and pagination. */
export function toSearchString(q: Partial<CatalogQuery>): string {
  const s = new URLSearchParams();
  if (q.search) s.set("search", q.search);
  if (q.category) s.set("category", q.category);
  if (q.sort && q.sort !== "default") s.set("sort", q.sort);
  if (q.min !== undefined) s.set("min", String(q.min));
  if (q.max !== undefined) s.set("max", String(q.max));
  if (q.page && q.page > 1) s.set("page", String(q.page));
  const str = s.toString();
  return str ? `?${str}` : "";
}

export function hasActiveFilters(q: CatalogQuery): boolean {
  return !!(q.search || q.min !== undefined || q.max !== undefined || q.category);
}
