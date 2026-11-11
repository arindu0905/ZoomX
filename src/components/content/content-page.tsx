import { FileWarning } from "lucide-react";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/layout";
import type { ContentPage } from "@/content/pages";

/** Long-form content page: generous measure, clear hierarchy, draft notice when unapproved. */
export function ContentPageView({ page, href, children }: { page: ContentPage; href: string; children?: ReactNode }) {
  return (
    <Container className="py-12 sm:py-16">
      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: page.title, href },
        ]}
      />
      <article className="mx-auto mt-10 max-w-3xl">
        <header className="mb-12">
          {page.eyebrow && (
            <p className="mb-3 text-caption font-semibold tracking-[0.08em] text-brand-strong uppercase">
              {page.eyebrow}
            </p>
          )}
          <h1 className="text-display text-balance">{page.lead ?? `${page.title}.`}</h1>
        </header>

        {page.status === "draft" && (
          <p role="note" className="mb-10 flex gap-3 bg-[#fff6e5] px-5 py-4 text-body text-[#7a4b00]">
            <FileWarning aria-hidden className="mt-0.5 size-5 shrink-0" />
            <span>
              <strong>Draft — awaiting approval.</strong> This page has not been approved by ZOOM X yet.
            </span>
          </p>
        )}

        <div className="flex flex-col gap-10">
          {page.sections.map((s, i) => (
            <section key={i} className="flex flex-col gap-4">
              {s.heading && <h2 className="text-title">{s.heading}</h2>}
              {s.paragraphs?.map((p, j) => (
                <p key={j} className="text-lead text-pretty text-ink-muted">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="flex list-disc flex-col gap-2 pl-6 text-lead text-ink-muted marker:text-brand-strong">
                  {s.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        {children}
      </article>
    </Container>
  );
}
