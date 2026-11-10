import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { hasActiveFilters, parseCatalogQuery, type RawSearchParams } from "@/lib/catalog-query";
import type { NavCategory } from "@/lib/navigation";
import { getProducts } from "@/services/woocommerce/catalog";
import { CatalogToolbar } from "./catalog-toolbar";
import { Pagination } from "./pagination";
import { ProductGrid } from "./product-grid";

/**
 * Toolbar + results + pagination for /shop and /category/[slug].
 * Reads searchParams, so callers render it inside <Suspense>.
 */
export async function CatalogResults({
  basePath,
  searchParams,
  category,
  categories,
}: {
  basePath: string;
  searchParams: Promise<RawSearchParams>;
  /** Fixed category for category pages (overrides ?category). */
  category?: string;
  categories?: NavCategory[];
}) {
  const parsed = parseCatalogQuery(await searchParams);
  const query = category ? { ...parsed, category } : parsed;
  const result = await getProducts(query);
  // The toolbar should not show the path category as a removable filter.
  const toolbarQuery = category ? { ...query, category: undefined } : query;

  return (
    <div className="flex flex-col gap-10">
      <CatalogToolbar action={basePath} query={toolbarQuery} categories={categories} total={result.total} />

      {!result.ok ? (
        <EmptyState
          title="Products are unavailable right now."
          body="We couldn’t reach the store. Please try again in a moment."
        />
      ) : result.items.length === 0 ? (
        hasActiveFilters(toolbarQuery) || query.page > 1 ? (
          <EmptyState
            title={query.search ? `No results for “${query.search}”.` : "No products match these filters."}
            body="Try a different search term or clear the filters."
            action={{ label: "Clear filters", href: basePath }}
          />
        ) : (
          <EmptyState
            title="No products here yet."
            body="Check back soon."
            action={{ label: "Shop all", href: "/shop" }}
          />
        )
      ) : (
        <>
          <ProductGrid products={result.items} />
          <Pagination basePath={basePath} query={toolbarQuery} totalPages={result.totalPages} />
        </>
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-canvas-alt px-6 py-20 text-center">
      <SearchX aria-hidden className="size-8 text-ink-muted" strokeWidth={1.5} />
      <h2 className="text-title">{title}</h2>
      <p className="max-w-prose text-body text-ink-muted">{body}</p>
      {action && (
        <ButtonLink href={action.href} variant="secondary">
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
