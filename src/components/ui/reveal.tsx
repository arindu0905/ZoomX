import { Fragment, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Fades content up as it scrolls into view. Pure CSS (scroll-driven
 * animation, see `.reveal` in globals.css): no JavaScript has to load before
 * the content is visible, and browsers without support simply show it.
 * `delay` (0–0.3) starts the reveal slightly later, to stagger neighbours.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("reveal", className)}
      style={delay ? ({ ...style, "--reveal-delay": delay } as CSSProperties) : style}
    >
      {children}
    </div>
  );
}

/**
 * Splits a line into words that slide up from behind a clip edge, one after
 * another. `on="load"` plays once at first paint (hero); `on="scroll"` is
 * tied to the heading entering the viewport.
 */
export function Words({ text, on = "scroll" }: { text: string; on?: "load" | "scroll" }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className={on === "load" ? "words" : "words words-scroll"}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span>
            <span style={{ "--i": i } as CSSProperties}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
