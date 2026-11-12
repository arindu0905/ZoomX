import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · ZOOM X Admin" },
  robots: { index: false, follow: false },
};

/**
 * The admin is signed-in and always live (orders, stock), so it renders on
 * the server per request instead of being prefetched as a static shell.
 * See node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md
 */
export const instant = false;

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
