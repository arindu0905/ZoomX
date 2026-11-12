"use client";

import { FileText, Home, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Tags, Ticket, Type, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOutAction } from "@/app/admin/actions";
import { cn } from "@/utils/cn";

const NAV = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Discounts", icon: Ticket },
  { href: "/admin/content", label: "Site content", icon: Type },
  { href: "/admin/pages", label: "Pages", icon: FileText },
] as const;

const active = (pathname: string, href: string) =>
  href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

/** Shopify-admin-style frame: fixed sidebar on desktop, slide-out menu on phones. */
export function AdminShell({ staffName, children }: { staffName: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          aria-current={active(pathname, href) ? "page" : undefined}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-black/5 hover:text-ink aria-[current=page]:bg-canvas aria-[current=page]:text-ink aria-[current=page]:shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
        >
          <Icon aria-hidden className="size-4" strokeWidth={1.75} />
          {label}
        </Link>
      ))}
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink/70 hover:bg-black/5 hover:text-ink"
        >
          <Home aria-hidden className="size-4" strokeWidth={1.75} />
          View website
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-ink/70 hover:bg-black/5 hover:text-ink"
          >
            <LogOut aria-hidden className="size-4" strokeWidth={1.75} />
            Sign out <span className="truncate text-ink-muted">· {staffName}</span>
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#f1f1f1] text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-[#1a1a1a] px-4 text-white">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="-ml-1 inline-flex size-10 items-center justify-center rounded-lg hover:bg-white/10 lg:hidden"
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
        <Link href="/admin" className="font-semibold tracking-tight">
          ZOOM X <span className="font-normal text-white/60">Admin</span>
        </Link>
        <span className="ml-auto hidden text-sm text-white/70 sm:block">{staffName}</span>
      </header>

      <div className="flex">
        <aside
          id="admin-nav"
          className={cn(
            "fixed inset-y-0 top-14 left-0 z-30 w-60 shrink-0 bg-[#ebebeb] transition-transform duration-300 lg:sticky lg:h-[calc(100dvh-3.5rem)] lg:translate-x-0",
            open ? "translate-x-0 shadow-xl" : "-translate-x-full",
          )}
        >
          {nav}
        </aside>
        {open && (
          <div aria-hidden className="fixed inset-0 top-14 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
        )}
        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
