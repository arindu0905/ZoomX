import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium btn-motion focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "btn-shine rounded-button bg-brand-strong text-white hover:bg-[#006618]",
  secondary:
    "rounded-button bg-transparent text-brand-strong shadow-[inset_0_0_0_1px_var(--color-brand-strong)] hover:bg-brand-strong hover:text-white",
  ghost: "rounded-button bg-canvas-alt text-ink hover:bg-[#e8e8ed]",
  link: "rounded-sm text-brand-strong underline-offset-4 hover:underline active:!transform-none hover:!transform-none hover:!shadow-none",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-sm",
  md: "h-11 px-6 text-body",
  lg: "h-14 px-8 text-lg",
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
