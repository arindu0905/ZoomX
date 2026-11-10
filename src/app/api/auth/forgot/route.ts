import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, readJson } from "@/lib/api-route";
import { forgotSchema } from "@/lib/account-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { wpLostPassword } from "@/services/auth/wordpress-auth";

/** Always answers the same way, so it can't be used to discover accounts. */
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  if (!rateLimit(`forgot:${clientIp(request.headers)}`, 5, 60 * 60_000)) {
    return apiError(429, "rate_limited", "Too many attempts. Please try again later.");
  }
  const body = await readJson(request, forgotSchema);
  if ("response" in body) return body.response;
  try {
    await wpLostPassword(body.data.email);
  } catch (err) {
    console.error("[auth] lost-password:", err instanceof Error ? err.message : "unknown error");
  }
  return apiOk({ ok: true });
}
