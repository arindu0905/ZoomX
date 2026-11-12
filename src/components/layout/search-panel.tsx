"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { productHref } from "@/components/products/product-card";
import { useDialog } from "@/hooks/use-dialog";
import { useSearchSuggestions } from "@/hooks/use-search-suggestions";
import { categoryHref, type NavCategory } from "@/lib/navigation";
import { iconButton, panelMotion } from "./header-shared";

const linkClass = "text-body font-medium hover:text-brand-strong";

export function SearchPanel({
  open,
  categories,
  onClose,
}: {
  open: boolean;
  categories: NavCategory[];
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useDialog<HTMLDivElement>(open, onClose, inputRef);
  const [term, setTerm] = useState("");
  const { status, results } = useSearchSuggestions(open ? term : "");
  const q = term.trim();
  const matchingCategories =
    q.length >= 2 ? categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          id="search-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          {...panelMotion}
          className="absolute inset-x-0 top-full z-10 max-h-[calc(100dvh-var(--spacing-nav))] overflow-y-auto bg-canvas pb-12 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.18)]"
        >
          <div className="mx-auto max-w-3xl px-gutter pt-8">
            {/* Plain GET form: works before hydration and without JavaScript. */}
            <form action="/shop" method="get" role="search" className="flex items-center gap-3">
              <Search aria-hidden className="size-6 shrink-0 text-ink-muted" strokeWidth={1.75} />
              <label htmlFor="site-search" className="sr-only">
                Search ZOOM X products
              </label>
              <input
                ref={inputRef}
                id="site-search"
                name="search"
                type="search"
                required
                maxLength={100}
                autoComplete="off"
                enterKeyHint="search"
                placeholder="Search zoomx.lk"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                aria-describedby="search-status"
                className="h-14 w-full bg-transparent text-title font-semibold outline-none placeholder:text-ink-muted/60 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => {
                    setTerm("");
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 rounded-full px-3 py-1.5 text-caption text-ink-muted hover:bg-black/5 hover:text-ink"
                >
                  Clear
                </button>
              )}
              <button type="button" onClick={onClose} aria-label="Close search" className={iconButton}>
                <X aria-hidden className="size-5" strokeWidth={1.75} />
              </button>
            </form>

            <p id="search-status" className="sr-only" role="status" aria-live="polite">
              {status === "done" ? `${results.length} suggestions` : status === "loading" ? "Searching" : ""}
            </p>

            <div className="mt-8">
              {q.length < 2 ? (
                <QuickLinks categories={categories} />
              ) : (
                <div className="flex flex-col gap-8">
                  {matchingCategories.length > 0 && (
                    <div>
                      <p className="text-caption text-ink-muted">Categories</p>
                      <ul className="mt-3 space-y-2">
                        {matchingCategories.map((c) => (
                          <li key={c.slug}>
                            <Link href={categoryHref(c.slug)} className={linkClass}>
                              {c.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-caption text-ink-muted">Products</p>
                    {status === "error" ? (
                      <p className="mt-3 text-body text-ink-muted">
                        Suggestions are unavailable. Press Enter to search.
                      </p>
                    ) : status === "done" && results.length === 0 ? (
                      <p className="mt-3 text-body text-ink-muted">No products match “{q}”.</p>
                    ) : (
                      <ul className="mt-3 flex flex-col gap-1" aria-busy={status === "loading"}>
                        {results.map((r) => (
                          <li key={r.id}>
                            <Link
                              href={productHref(r.slug)}
                              className="-mx-3 flex items-center gap-4 rounded-card px-3 py-2 hover:bg-canvas-alt"
                            >
                              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-canvas-alt">
                                {r.image && (
                                  <Image src={r.image} alt="" fill sizes="48px" className="object-contain p-1" />
                                )}
                              </span>
                              <span className="flex flex-1 flex-col">
                                <span className="text-body font-medium">{r.name}</span>
                                <span className="text-caption text-ink-muted">
                                  {r.price}
                                  {!r.inStock && " · Out of stock"}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {status === "done" && results.length > 0 && (
                      <Link
                        href={`/shop?search=${encodeURIComponent(q)}`}
                        className="mt-4 inline-block text-body font-medium text-brand-strong hover:underline"
                      >
                        See all results for “{q}”
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuickLinks({ categories }: { categories: NavCategory[] }) {
  return (
    <>
      <p className="text-caption text-ink-muted">Quick links</p>
      <ul className="mt-3 space-y-2">
        <li>
          <Link href="/shop" className={linkClass}>
            All products
          </Link>
        </li>
        {categories.slice(0, 5).map((c) => (
          <li key={c.slug}>
            <Link href={categoryHref(c.slug)} className={linkClass}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
