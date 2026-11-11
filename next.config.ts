import type { NextConfig } from "next";

/** Allows next/image to optimise media from the configured WooCommerce host (staging, sandbox or live). */
function storeImagePattern() {
  const raw = process.env.WOOCOMMERCE_STORE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const protocol = url.protocol.replace(":", "") as "http" | "https";
    return [{ protocol, hostname: url.hostname, port: url.port, pathname: "/wp-content/uploads/**" }];
  } catch {
    return [];
  }
}

/**
 * Next 16 refuses to optimise images that resolve to private IPs (SSRF
 * guard). Relax it ONLY when the store itself is on loopback — i.e. the
 * local WooCommerce sandbox — never for a real store URL.
 */
function storeIsLoopback() {
  try {
    const { hostname } = new URL(process.env.WOOCOMMERCE_STORE_URL ?? "");
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]";
  } catch {
    return false;
  }
}

const isDev = process.env.NODE_ENV !== "production";
// HTTPS-only directives apply when the site is actually served over HTTPS
// (not for local `next start` on http://localhost).
const httpsSite = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

/**
 * Content Security Policy. Next.js inlines bootstrap scripts; nonces would
 * force every page to render per request (losing static/cached pages), so
 * inline scripts are allowed but every *origin* is locked to this site.
 * Forms may only post to this site and PayHere's checkout.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "form-action 'self' https://sandbox.payhere.lk https://www.payhere.lk",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(httpsSite ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    dangerouslyAllowLocalIP: storeIsLoopback(),
    // WooCommerce media is served from the WordPress host. Tightened to the
    // exact host once WOOCOMMERCE_STORE_URL is confirmed.
    remotePatterns: [
      { protocol: "https", hostname: "zoomx.lk", pathname: "/wp-content/uploads/**" },
      ...storeImagePattern(),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          ...(!httpsSite ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
        ],
      },
    ];
  },
};

export default nextConfig;
