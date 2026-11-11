import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-[0.06em] transition-[background-color,color,box-shadow] duration-200 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  // Shopify-theme buttons: square, solid or 1px outline that thickens on hover.
  primary: "rounded-none bg-brand-strong text-white shadow-[inset_0_0_0_1px_var(--color-brand-strong)] hover:shadow-[inset_0_0_0_2px_#00591a]",
  secondary:
    "rounded-none bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--color-ink)] hover:shadow-[inset_0_0_0_2px_var(--color-ink)]",
  ghost: "rounded-none bg-canvas-alt text-ink hover:bg-line",
  link: "rounded-none text-ink underline underline-offset-[0.3em] decoration-1 hover:decoration-2",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-5 text-sm",
  md: "min-h-[2.875rem] px-7 text-[0.9375rem]",
  lg: "min-h-[3.25rem] px-9 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], variant !== "link" && sizes[size], className);
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
