"use client";

import { forwardRef, useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/utils/cn";

const control =
  "h-12 w-full bg-canvas px-4 text-body text-ink shadow-[inset_0_0_0_1px_var(--color-ink-muted)] outline-none transition-shadow focus-visible:shadow-[inset_0_0_0_2px_var(--color-brand-strong)] aria-[invalid=true]:shadow-[inset_0_0_0_2px_var(--color-danger)]";

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
}

function FieldShell({
  id,
  label,
  error,
  hint,
  optional,
  className,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-muted">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: ReactNode) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export const TextField = forwardRef<HTMLInputElement, FieldProps & ComponentProps<"input">>(function TextField(
  { label, error, hint, optional, className, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        className={control}
        {...props}
      />
    </FieldShell>
  );
});

export const SelectField = forwardRef<HTMLSelectElement, FieldProps & ComponentProps<"select">>(function SelectField(
  { label, error, hint, optional, className, children, ...props },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          control,
          "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 fill=%22none%22 stroke=%22%236e6e73%22 stroke-width=%221.5%22><path d=%22m2 4 4 4 4-4%22/></svg>')] bg-[position:right_1rem_center] bg-no-repeat pr-10",
        )}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export const TextAreaField = forwardRef<HTMLTextAreaElement, FieldProps & ComponentProps<"textarea">>(
  function TextAreaField({ label, error, hint, optional, className, ...props }, ref) {
    const id = useId();
    return (
      <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(control, "h-auto min-h-24 py-3")}
          {...props}
        />
      </FieldShell>
    );
  },
);
