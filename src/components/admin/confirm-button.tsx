"use client";

import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

/** Submit button that asks for confirmation first (deletes). Works as a plain submit without JavaScript. */
export function ConfirmButton({
  message,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { message: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-lg bg-canvas px-4 text-sm font-semibold text-danger shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-[#fdecec]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
