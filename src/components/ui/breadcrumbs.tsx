import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { breadcrumbJsonLd, jsonLdString, type Crumb } from "@/lib/structured-data";
import { cn } from "@/utils/cn";

/** Visible breadcrumb trail + BreadcrumbList structured data. The last crumb is the current page. */
export function Breadcrumbs({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-caption text-ink-muted", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="text-ink">
                  {c.name}
                </span>
              ) : (
                <>
                  <Link href={c.href} className="rounded-sm hover:text-ink hover:underline underline-offset-4">
                    {c.name}
                  </Link>
                  <ChevronRight aria-hidden className="size-3.5" />
                </>
              )}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(breadcrumbJsonLd(crumbs)),
        }}
      />
    </nav>
  );
}
