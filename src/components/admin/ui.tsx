import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/cn";
import { statusClass, statusLabel } from "./format";

export function PageHeader({ title, back, actions }: { title: string; back?: { href: string; label: string }; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {back && (
        <Link href={back.href} className="text-sm text-ink-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <h1 className="w-full text-2xl font-semibold tracking-tight">{title}</h1>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-canvas p-5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]", className)}>
      {title && <h2 className="mb-4 text-sm font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Badge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", statusClass(status))}>
      {statusLabel(status)}
    </span>
  );
}

/** Success / error banner driven by ?saved= or ?error= on the URL. */
export function Notice({ saved, error }: { saved?: string; error?: string }) {
  if (error)
    return (
      <p role="alert" className="mb-5 rounded-xl bg-[#fdecec] px-4 py-3 text-sm text-danger">
        {error}
      </p>
    );
  if (saved)
    return (
      <p role="status" className="mb-5 rounded-xl bg-brand-tint px-4 py-3 text-sm text-brand-strong">
        {saved}
      </p>
    );
  return null;
}

export const inputClass =
  "w-full rounded-lg bg-canvas px-3 py-2 text-sm shadow-[inset_0_0_0_1px_var(--color-line)] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-brand-strong)]";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export function AdminButton({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      type="submit"
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50",
        variant === "primary" && "bg-[#1a1a1a] text-white hover:bg-black",
        variant === "secondary" && "bg-canvas shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-canvas-alt",
        variant === "danger" && "bg-canvas text-danger shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-[#fdecec]",
        className,
      )}
      {...props}
    />
  );
}

export function AdminLinkButton({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-lg bg-canvas px-4 text-sm font-semibold shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-canvas-alt",
        className,
      )}
      {...props}
    />
  );
}

/** Simple previous / next pager that keeps other query params. */
export function Pager({ page, totalPages, href }: { page: number; totalPages: number; href: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      {page > 1 ? <AdminLinkButton href={href(page - 1)}>Previous</AdminLinkButton> : <span />}
      <span className="text-ink-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? <AdminLinkButton href={href(page + 1)}>Next</AdminLinkButton> : <span />}
    </nav>
  );
}

export function EmptyRow({ cols, children }: { cols: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-sm text-ink-muted">
        {children}
      </td>
    </tr>
  );
}

/** Horizontally scrollable table wrapper so wide tables work on phones. */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-canvas shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-xs [&_th]:font-medium [&_th]:text-ink-muted [&_thead]:bg-canvas-alt [&_tr]:border-b [&_tr]:border-line last:[&_tbody_tr]:border-0">
          {children}
        </table>
      </div>
    </div>
  );
}
