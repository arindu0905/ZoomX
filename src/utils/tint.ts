import type { CSSProperties } from "react";

/*
 * Per-product colour. The packshots are the only colour on an otherwise
 * neutral site, so each product (and category) carries a hue matched to its
 * bottle. Hues are OKLCH angles sampled from the real ZOOM X packshots;
 * anything unrecognised gets a stable hue from its slug.
 *
 * Surfaces read three CSS variables:
 *   --tint       pale wash for large surfaces
 *   --tint-glow  stronger tone for glows and gradients
 *   --tint-ink   dark tone, safe for text on --tint (≥ 4.5:1)
 */
const HUES: [RegExp, number][] = [
  [/dish|kitchen/, 145], // green
  [/laundry|detergent/, 235], // blue
  [/fabric|conditioner|softener/, 350], // pink
  [/all-purpose|all-surface|surface/, 305], // violet
  [/general/, 55], // orange
  [/glass|window/, 225], // sky
  [/tile|floor/, 90], // yellow
  [/toilet|bathroom/, 270], // indigo
  [/hand|personal|hygiene|soap/, 25], // red
  [/air|freshener/, 70], // amber
];

export function tintHue(slug: string): number {
  const s = slug.toLowerCase();
  for (const [pattern, hue] of HUES) if (pattern.test(s)) return hue;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export interface Tint {
  soft: string;
  glow: string;
  ink: string;
}

export function tint(slug: string): Tint {
  const h = tintHue(slug);
  return {
    soft: `oklch(0.965 0.028 ${h})`,
    glow: `oklch(0.9 0.075 ${h})`,
    ink: `oklch(0.42 0.13 ${h})`,
  };
}

/** Spread onto an element's `style` to expose the tint variables to it and its children. */
export function tintStyle(slug: string): CSSProperties {
  const t = tint(slug);
  return { "--tint": t.soft, "--tint-glow": t.glow, "--tint-ink": t.ink } as CSSProperties;
}
