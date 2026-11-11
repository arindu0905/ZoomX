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
import { useCartStore } from "@/store/cart";
import { useUiStore } from "@/store/ui";
import { cn } from "@/utils/cn";

/** Shopify-theme menu link: plain text, underline when hovered or current. */
const navText =
  "inline-flex h-11 items-center gap-1 px-3 text-[0.9375rem] tracking-[0.04em] text-ink/75 underline-offset-[0.3em] transition-colors hover:text-ink hover:underline";

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
      <div className="relative z-20 border-b border-line bg-canvas">
        {/*
          Shopify-theme header. Desktop: logo, inline menu, icons.
          Mobile: menu button, centred logo, search + cart.
        */}
        <nav
          aria-label="Main"
          className="mx-auto grid h-nav max-w-page grid-cols-[1fr_auto_1fr] items-center px-gutter md:flex md:h-20 md:gap-8"
        >
          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label={panel === "menu" ? "Close menu" : "Open menu"}
              aria-expanded={panel === "menu"}
              aria-controls="mobile-menu"
              onClick={() => toggle("menu")}
              className={cn(iconButton, "-ml-3")}
            >
              {panel === "menu" ? (
                <X aria-hidden className="size-5" strokeWidth={1.5} />
              ) : (
                <Menu aria-hidden className="size-5" strokeWidth={1.5} />
              )}
            </button>
          </div>

          <Logo className="h-10 justify-self-center md:h-12" priority />

          {/* Desktop menu */}
          <ul className="hidden flex-1 items-center gap-1 md:flex">
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
                className={cn(navText, panel === "categories" && "text-ink underline")}
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

          <div className="-mr-3 flex items-center justify-self-end">
            <button
              type="button"
              aria-label="Search products"
              aria-expanded={panel === "search"}
              aria-controls="search-panel"
              onClick={() => toggle("search")}
              className={iconButton}
            >
              <Search aria-hidden className="size-5" strokeWidth={1.5} />
            </button>
            <Link href="/account" aria-label="Account" className={cn(iconButton, "max-md:hidden")}>
              <User aria-hidden className="size-5" strokeWidth={1.5} />
            </Link>
            <BagLink />
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
      className={cn(navText, active && "text-ink underline")}
    >
      {label}
    </Link>
  );
}

function BagLink() {
  // Display-only mirror of WooCommerce's items_count.
  const count = useCartStore((s) => s.cart?.items_count ?? 0);
  const toggle = useUiStore((s) => s.toggle);
  return (
    <Link
      href="/cart"
      onClick={(e) => {
        // Opens the drawer once hydrated; without JavaScript it links to /cart.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        toggle("bag");
      }}
      aria-label={count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}
      className={cn(iconButton, "relative")}
    >
      <ShoppingBag aria-hidden className="size-5" strokeWidth={1.5} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute right-1.5 bottom-1.5 flex min-w-[1.125rem] items-center justify-center rounded-full bg-brand-strong px-1 text-[10px] leading-[1.125rem] font-semibold text-white tabular-nums"
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
          className="absolute inset-x-0 top-full z-10 hidden border-b border-line bg-canvas pb-10 md:block"
        >
          <div className="mx-auto grid max-w-page grid-cols-[1fr_2fr] gap-12 px-gutter pt-8">
            <div>
              <p className="text-caption text-ink-muted">Shop</p>
              <Link href="/shop" className="mt-3 block text-lg font-semibold underline-offset-[0.3em] hover:underline">
                Shop all products
              </Link>
              <Link href="/for-businesses" className="mt-2 block text-2xl font-semibold tracking-tight hover:text-brand-strong">
                For businesses
              </Link>
            </div>
            <div>
              <p className="text-caption text-ink-muted">Categories</p>
              {categories.length ? (
                <ul className="mt-3 grid grid-cols-2 gap-x-10 gap-y-3">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link href={categoryHref(c.slug)} className="text-[0.9375rem] text-ink/75 underline-offset-[0.3em] hover:text-ink hover:underline">
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
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%", transition: { duration: 0.2 } }}
          transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="fixed top-nav bottom-0 left-0 z-10 w-[min(100%,24rem)] overflow-y-auto border-t border-line bg-canvas md:hidden"
        >
          <motion.ul
            className="px-gutter pt-4 pb-16"
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
                    <summary className="flex h-14 cursor-pointer list-none items-center justify-between text-lg [&::-webkit-details-marker]:hidden">
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
      className="flex h-14 items-center text-lg aria-[current=page]:underline aria-[current=page]:underline-offset-[0.3em]"
    >
      {label}
    </Link>
  );
}
