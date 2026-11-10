"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Logo } from "@/components/ui/logo";
import { iconButton, panelMotion } from "./header-shared";
import { SearchPanel } from "./search-panel";
import { useDialog } from "@/hooks/use-dialog";
import { categoryHref, primaryNav, type NavCategory } from "@/lib/navigation";
import { useUiStore } from "@/store/ui";
import { cn } from "@/utils/cn";

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/**
 * The pathname is request data. Reading it during prerender outside a
 * Suspense boundary makes on-demand re-renders (ISR / webhook revalidation)
 * fail, but wrapping the whole header would delay its interactivity until
 * the stream arrives. So only the pathname-dependent bits are suspended:
 * close-on-navigate and the active-link state. The mobile menu reads it
 * only while open (client-side).
 */
export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const { panel, toggle, close } = useUiStore();

  const [home, ...rest] = primaryNav;

  return (
    <header className="sticky top-0 z-50">
      <Suspense fallback={null}>
        <CloseOnNavigate onNavigate={close} />
      </Suspense>
      <div
        className={cn(
          "relative z-20 border-b border-black/[0.06] backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300",
          panel ? "bg-canvas" : "bg-canvas/80",
        )}
      >
        <nav aria-label="Main" className="mx-auto flex h-nav max-w-page items-center gap-2 px-gutter">
          <Logo className="h-8 md:h-9" priority />

          {/* Desktop links */}
          <ul className="ml-6 hidden flex-1 items-center justify-center gap-1 md:flex">
            {[home, rest[0]].map((l) => (
              <NavItem key={l.href} href={l.href}>
                {l.label}
              </NavItem>
            ))}
            <li>
              <button
                type="button"
                aria-expanded={panel === "categories"}
                aria-controls="categories-flyout"
                onClick={() => toggle("categories")}
                className={cn(
                  "inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm text-ink/80 transition-colors hover:text-ink",
                  panel === "categories" && "text-ink",
                )}
              >
                Categories
                <ChevronDown
                  aria-hidden
                  className={cn("size-3.5 transition-transform duration-300", panel === "categories" && "rotate-180")}
                />
              </button>
            </li>
            {rest.slice(1).map((l) => (
              <NavItem key={l.href} href={l.href}>
                {l.label}
              </NavItem>
            ))}
          </ul>

          <div className="ml-auto flex items-center md:ml-0">
            <button
              type="button"
              aria-label="Search products"
              aria-expanded={panel === "search"}
              aria-controls="search-panel"
              onClick={() => toggle("search")}
              className={iconButton}
            >
              <Search aria-hidden className="size-[18px]" strokeWidth={1.75} />
            </button>
            <Link href="/account" aria-label="Account" className={cn(iconButton, "max-md:hidden")}>
              <User aria-hidden className="size-[18px]" strokeWidth={1.75} />
            </Link>
            <BagLink />
            <button
              type="button"
              aria-label={panel === "menu" ? "Close menu" : "Open menu"}
              aria-expanded={panel === "menu"}
              aria-controls="mobile-menu"
              onClick={() => toggle("menu")}
              className={cn(iconButton, "md:hidden")}
            >
              {panel === "menu" ? (
                <X aria-hidden className="size-5" strokeWidth={1.75} />
              ) : (
                <Menu aria-hidden className="size-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </nav>
      </div>

      <CategoriesFlyout open={panel === "categories"} categories={categories} onClose={close} />
      <SearchPanel open={panel === "search"} categories={categories} onClose={close} />
      <MobileMenu open={panel === "menu"} categories={categories} onClose={close} />

      {/* Dim page behind any open panel */}
      <AnimatePresence>
        {panel && (
          <motion.div
            key="scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 top-0 z-0 bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </header>
  );
}

function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  useEffect(() => onNavigate(), [pathname, onNavigate]);
  return null;
}

function NavItem({ href, children }: { href: string; children: string }) {
  return (
    <li>
      <Suspense fallback={<NavLink href={href} active={false} label={children} />}>
        <ActiveNavLink href={href} label={children} />
      </Suspense>
    </li>
  );
}

function ActiveNavLink({ href, label }: { href: string; label: string }) {
  return <NavLink href={href} active={isActive(usePathname(), href)} label={label} />;
}

function NavLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-11 items-center rounded-full px-3 text-sm transition-colors hover:text-ink",
        active ? "text-ink" : "text-ink/80",
      )}
    >
      {label}
    </Link>
  );
}

function BagLink() {
  const count = useUiStore((s) => s.bagCount);
  return (
    <Link
      href="/cart"
      aria-label={count ? `Shopping bag, ${count} ${count === 1 ? "item" : "items"}` : "Shopping bag"}
      className={cn(iconButton, "relative")}
    >
      <ShoppingBag aria-hidden className="size-[18px]" strokeWidth={1.75} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute right-1.5 bottom-1.5 flex min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] leading-4 font-semibold text-white tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function CategoriesFlyout({
  open,
  categories,
  onClose,
}: {
  open: boolean;
  categories: NavCategory[];
  onClose: () => void;
}) {
  const ref = useDialog<HTMLDivElement>(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          id="categories-flyout"
          role="dialog"
          aria-modal="true"
          aria-label="Shop by category"
          {...panelMotion}
          className="absolute inset-x-0 top-full z-10 hidden bg-canvas pb-14 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.18)] md:block"
        >
          <div className="mx-auto grid max-w-page grid-cols-[1fr_2fr] gap-12 px-gutter pt-10">
            <div>
              <p className="text-caption text-ink-muted">Shop</p>
              <Link href="/shop" className="mt-3 block text-title hover:text-brand-strong">
                All products
              </Link>
            </div>
            <div>
              <p className="text-caption text-ink-muted">Categories</p>
              {categories.length ? (
                <ul className="mt-3 grid grid-cols-2 gap-x-10 gap-y-2">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={categoryHref(c.slug)} className="text-lead font-semibold hover:text-brand-strong">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-body text-ink-muted">Browse every ZOOM X product in the shop.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileMenu({ open, categories, onClose }: { open: boolean; categories: NavCategory[]; onClose: () => void }) {
  const ref = useDialog<HTMLDivElement>(open, onClose);
  const items = [
    ...primaryNav.slice(0, 2),
    { label: "Categories", href: "#categories" },
    ...primaryNav.slice(2),
    { label: "Account", href: "/account" },
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="fixed inset-x-0 top-nav bottom-0 z-10 overflow-y-auto bg-canvas md:hidden"
        >
          <motion.ul
            className="px-gutter pt-6 pb-16"
            initial="hidden"
            animate="show"
            variants={{
              show: {
                transition: { staggerChildren: 0.04, delayChildren: 0.05 },
              },
            }}
          >
            {items.map((item) => (
              <motion.li
                key={item.label}
                variants={{
                  hidden: { opacity: 0, y: -6 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                {item.href === "#categories" ? (
                  <details className="group">
                    <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-title [&::-webkit-details-marker]:hidden">
                      Categories
                      <ChevronDown
                        aria-hidden
                        className="size-5 text-ink-muted transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <ul className="space-y-1 pb-3 pl-1">
                      <li>
                        <Link href="/shop" className="flex h-10 items-center text-body text-ink-muted hover:text-ink">
                          All products
                        </Link>
                      </li>
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={categoryHref(c.slug)}
                            className="flex h-10 items-center text-body text-ink-muted hover:text-ink"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <MobileNavLink href={item.href} label={item.label} />
                )}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Rendered only while the mobile menu is open, i.e. on the client. */
function MobileNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      aria-current={isActive(pathname, href) ? "page" : undefined}
      className="flex h-14 items-center text-title aria-[current=page]:text-brand-strong"
    >
      {label}
    </Link>
  );
}
