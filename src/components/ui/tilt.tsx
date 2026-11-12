"use client";

import type { ComponentProps } from "react";

/**
 * Tracks the pointer over a surface and exposes it as --rx / --ry (degrees).
 * Any descendant with the `tilt-target` class leans toward the pointer in 3D.
 * Mouse only; touch and reduced-motion users get a still surface.
 */
export function Tilt({ max = 10, ...props }: { max?: number } & ComponentProps<"div">) {
  return (
    <div
      {...props}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (x * 2 * max).toFixed(2));
        el.style.setProperty("--rx", (-y * 2 * max).toFixed(2));
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--rx", "0");
        e.currentTarget.style.setProperty("--ry", "0");
      }}
    />
  );
}
