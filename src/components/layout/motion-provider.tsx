"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Honours the OS "reduce motion" setting for every Framer Motion animation. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}>
      {children}
    </MotionConfig>
  );
}
