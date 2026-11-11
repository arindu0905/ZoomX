import { MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/layout";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with ZOOM X for product questions, orders and bulk enquiries.",
  alternates: { canonical: "/contact" },
};

/**
 * Real contact details from zoomx.lk. There is deliberately no contact form
 * yet: no email delivery service is configured, and a form that silently
 * goes nowhere is worse than none. The email address is shown once confirmed.
 */
export default function ContactPage() {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.contact.office)}`;
  return (
    <Container className="py-12 sm:py-16">
      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />
      <div className="mx-auto mt-10 max-w-3xl">
        <p className="mb-3 text-caption font-semibold tracking-[0.08em] text-brand-strong uppercase">Contact us</p>
        <h1 className="text-display text-balance">Get in touch.</h1>
        <p className="mt-6 text-lead text-pretty text-ink-muted">
          Questions about our products, an order, or supplying your business? We’re here to help.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <a
            href={site.contact.phoneHref}
            className="group flex flex-col gap-3 bg-canvas-alt p-8 transition-colors hover:bg-[#ececf0]"
          >
            <Phone aria-hidden className="size-6 text-brand-strong" strokeWidth={1.75} />
            <span className="text-caption text-ink-muted">Call us</span>
            <span className="text-title">{site.contact.phone}</span>
          </a>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 bg-canvas-alt p-8 transition-colors hover:bg-[#ececf0]"
          >
            <MapPin aria-hidden className="size-6 text-brand-strong" strokeWidth={1.75} />
            <span className="text-caption text-ink-muted">Office</span>
            <span className="text-lead">{site.contact.office}</span>
            <span className="text-caption text-brand-strong">Open in Google Maps</span>
          </a>
        </div>

        <dl className="mt-12 grid gap-6 text-body sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Factory</dt>
            <dd className="mt-1 text-ink-muted">{site.contact.factory}</dd>
          </div>
          {site.contact.email && (
            <div>
              <dt className="font-semibold">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${site.contact.email}`} className="text-brand-strong hover:underline">
                  {site.contact.email}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="font-semibold">Company</dt>
            <dd className="mt-1 text-ink-muted">{site.legalEntity}</dd>
          </div>
        </dl>

        <p className="mt-12 text-body text-ink-muted">
          Checking on an order?{" "}
          <Link href="/orders/track" className="text-brand-strong underline underline-offset-4">
            Track it here
          </Link>
          . Buying for a business?{" "}
          <Link href="/for-businesses" className="text-brand-strong underline underline-offset-4">
            See bulk options
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
