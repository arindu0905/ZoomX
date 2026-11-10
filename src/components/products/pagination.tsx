import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toSearchString, type CatalogQuery } from "@/lib/catalog-query";
import { cn } from "@/utils/cn";

/** Windowed page list: 1 … 4 5 6 … 12 */
export function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const item =
  "inline-flex size-11 items-center justify-center rounded-full text-body transition-colors hover:bg-canvas-alt focus-visible:outline-2 focus-visible:outline-offset-2";

export function Pagination({
  basePath,
  query,
  totalPages,
}: {
  basePath: string;
  query: CatalogQuery;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const href = (page: number) => `${basePath}${toSearchString({ ...query, page })}`;
  const { page } = query;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} className={item} aria-label="Previous page" rel="prev">
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-30")} aria-hidden>
          <ChevronLeft className="size-5" />
        </span>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-muted" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page && "bg-ink font-semibold text-white hover:bg-ink")}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={item} aria-label="Next page" rel="next">
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      ) : (
        <span className={cn(item, "opacity-30")} aria-hidden>
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}
