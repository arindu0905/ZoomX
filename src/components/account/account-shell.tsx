import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/layout";
import { cn } from "@/utils/cn";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/details", label: "Details & address" },
] as const;

/** Signed-in account layout: heading, section nav, sign out. */
export function AccountShell({
  title,
  current,
  children,
}: {
  title: string;
  current: (typeof NAV)[number]["href"];
  children: ReactNode;
}) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-display">{title}</h1>
        <SignOutButton />
      </div>
      <nav aria-label="Account" className="mt-8 border-b border-line">
        <ul className="-mb-px flex gap-6 overflow-x-auto">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.href === current ? "page" : undefined}
                className={cn(
                  "inline-block border-b-2 pb-3 text-body whitespace-nowrap transition-colors",
                  item.href === current
                    ? "border-ink font-semibold"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-10">{children}</div>
    </Container>
  );
}

export function AccountLoading() {
  return (
    <Container className="py-16">
      <p className="text-center text-body text-ink-muted">Loading your account…</p>
    </Container>
  );
}
