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

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
