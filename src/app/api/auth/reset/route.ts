import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { resetSchema } from "@/lib/account-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { endCustomerSession } from "@/services/auth/session";
import { wpResetPassword } from "@/services/auth/wordpress-auth";

export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  if (!rateLimit(`reset:${clientIp(request.headers)}`, 10, 60 * 60_000)) {
    return apiError(429, "rate_limited", "Too many attempts. Please try again later.");
  }
  const body = await readJson(request, resetSchema);
  if ("response" in body) return body.response;
  try {
    await wpResetPassword(body.data.login, body.data.key, body.data.password);
    await endCustomerSession(); // sign in again with the new password
    return apiOk({ ok: true });
  } catch (err) {
    return handleApiError("reset", err);
  }
}
