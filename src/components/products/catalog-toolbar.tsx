"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { buttonClasses } from "@/components/ui/button";
import { SORT_OPTIONS, type CatalogQuery } from "@/lib/catalog-query";
import type { NavCategory } from "@/lib/navigation";
import { cn } from "@/utils/cn";

const field =
  "h-11 rounded-full bg-canvas-alt px-4 text-body text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-strong";

/**
 * Sort + filters as a plain GET form (works without JavaScript); next/form
 * turns submissions into client-side navigations. Selects submit on change.
 */
export function CatalogToolbar({
  action,
  query,
  categories,
  total,
}: {
  action: string;
  query: CatalogQuery;
  /** Shown on /shop only; category pages scope by path. */
  categories?: NavCategory[];
  total: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();
  const activeFilters = !!(query.search || query.min !== undefined || query.max !== undefined || query.category);

  return (
    <Form
      ref={formRef}
      action={action}
      onSubmit={(e) => {
        // Keep URLs canonical: drop empty fields and the default sort.
        for (const el of Array.from(e.currentTarget.elements)) {
          if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
            const empty = el.value.trim() === "" || (el.name === "sort" && el.value === "default");
            if (empty && el.name) el.disabled = true;
          }
        }
        requestAnimationFrame(() => {
          for (const el of Array.from(formRef.current?.elements ?? [])) (el as HTMLInputElement).disabled = false;
        });
      }}
      className="flex flex-col gap-4"
      aria-label="Filter and sort products"
    >
      {query.search && <input type="hidden" name="search" value={query.search} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body text-ink-muted" role="status" aria-live="polite">
          {total === 1 ? "1 product" : `${total} products`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {categories && categories.length > 0 && (
            <label className="flex items-center">
              <span className="sr-only">Category</span>
              <select name="category" defaultValue={query.category ?? ""} onChange={submit} className={field}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center">
            <span className="sr-only">Sort by</span>
            <select name="sort" defaultValue={query.sort} onChange={submit} className={field}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {/* Native disclosure: works before hydration and without JavaScript. */}
          <details className="group relative">
            <summary
              className={buttonClasses({
                variant: "ghost",
                className: "h-11 cursor-pointer list-none [&::-webkit-details-marker]:hidden",
              })}
            >
              <SlidersHorizontal aria-hidden className="size-4" />
              Price
            </summary>
            <fieldset className="absolute right-0 z-10 mt-2 flex w-max max-w-[calc(100vw-2*var(--spacing-gutter))] flex-wrap items-end gap-3 rounded-3xl bg-canvas-alt p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.25)]">
              <legend className="sr-only">Price range in LKR</legend>
              <label className="flex flex-col gap-1.5 text-caption text-ink-muted">
                Min (LKR)
                <input
                  name="min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  defaultValue={query.min}
                  className={cn(field, "w-36 bg-canvas")}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-caption text-ink-muted">
                Max (LKR)
                <input
                  name="max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  defaultValue={query.max}
                  className={cn(field, "w-36 bg-canvas")}
                />
              </label>
              <button type="submit" className={buttonClasses({ size: "md" })}>
                Apply
              </button>
            </fieldset>
          </details>
        </div>
      </div>

      {activeFilters && (
        <div className="flex flex-wrap items-center gap-2 text-caption">
          {query.search && <span className="text-ink-muted">Results for “{query.search}”</span>}
          <Link
            href={action}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-brand-strong hover:underline"
          >
            <X aria-hidden className="size-3.5" />
            Clear all
          </Link>
        </div>
      )}
    </Form>
  );
}
