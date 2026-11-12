import { ViewTransition } from "react";

/**
 * Re-mounts on every storefront navigation, so the outgoing page fades back
 * while the new one lifts in (classes .page-out / .page-in in globals.css).
 * A template, not the layout: layouts persist, so enter/exit never fire there.
 */
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
