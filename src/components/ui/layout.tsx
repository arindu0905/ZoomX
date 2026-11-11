import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Centred page-width wrapper with responsive gutters. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-page px-gutter", className)} {...props} />;
}

type Tone = "default" | "alt" | "dark";

const tones: Record<Tone, string> = {
  default: "bg-canvas text-ink",
  alt: "bg-canvas-alt text-ink",
  dark: "bg-ink text-white",
};

/**
 * Full-bleed section. Sections alternate tone instead of using borders or
 * cards to separate content.
 */
export function Section({
  tone = "default",
  as: Tag = "section",
  className,
  children,
  ...props
}: { tone?: Tone; as?: ElementType; children: ReactNode } & ComponentProps<"section">) {
  return (
    <Tag className={cn("py-section", tones[tone], className)} {...props}>
      {children}
    </Tag>
  );
}

/** Eyebrow + heading + optional lead, centred by default. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  as: Heading = "h2",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "start";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex max-w-prose flex-col gap-3",
        align === "center" ? "mx-auto items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow && <p className="text-sm font-semibold tracking-[0.12em] text-brand-strong uppercase">{eyebrow}</p>}
      <Heading className="text-headline text-balance">{title}</Heading>
      {lead && <p className="text-lead text-pretty text-ink-muted">{lead}</p>}
    </header>
  );
}
