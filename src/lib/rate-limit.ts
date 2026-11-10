import "server-only";

/**
 * Fixed-window rate limiter, in memory. On serverless platforms each instance
 * keeps its own counters, so this is a best-effort brake against bursts from
 * one client, not a global guarantee. For strict limits, back it with a
 * shared store (e.g. Vercel KV / Upstash) — see docs (Phase 10).
 */
const buckets = new Map<string, { count: number; reset: number }>();
const MAX_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
