import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/ui/layout";
import { Logo } from "@/components/ui/logo";
import { footerNav, legalNav } from "@/lib/navigation";
import { site } from "@/lib/site";

const socialLabels: Record<keyof typeof site.social, string> = {
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X",
};

// Cached at build/revalidation time; refreshes on every deploy.
async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export function SiteFooter() {
  const socials = (Object.keys(site.social) as (keyof typeof site.social)[])
    .map((key) => ({ key, href: site.social[key], label: socialLabels[key] }))
    .filter((s): s is { key: keyof typeof site.social; href: string; label: string } => !!s.href);

  return (
    <footer className="border-t border-line bg-canvas text-sm tracking-[0.03em] text-ink-muted">
      <Container className="pt-12 pb-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Logo className="h-14" />
            <p className="max-w-xs text-pretty">{site.tagline} Household cleaning and home care, made in Sri Lanka.</p>
          </div>

          {footerNav.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="text-base font-semibold text-ink">{group.heading}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="underline-offset-[0.3em] hover:text-ink hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <address className="mt-12 grid gap-6 border-t border-line pt-8 not-italic sm:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Office</h2>
            <p className="mt-1">{site.contact.office}</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Factory</h2>
            <p className="mt-1">{site.contact.factory}</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Get in touch</h2>
            <p className="mt-1">
              <a href={site.contact.phoneHref} className="underline-offset-[0.3em] hover:text-ink hover:underline">
                {site.contact.phone}
              </a>
            </p>
            {site.contact.email && (
              <p>
                <a href={`mailto:${site.contact.email}`} className="underline-offset-[0.3em] hover:text-ink hover:underline">
                  {site.contact.email}
                </a>
              </p>
            )}
          </div>
        </address>

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>
            Copyright ©{" "}
            <Suspense>
              <CopyrightYear />
            </Suspense>{" "}
            {site.legalEntity}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-y-2 divide-x divide-line [&>li]:px-2.5 [&>li:first-child]:pl-0">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="underline-offset-[0.3em] hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
            {socials.map((s) => (
              <li key={s.key}>
                <a href={s.href} rel="noopener noreferrer" target="_blank" className="hover:text-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
