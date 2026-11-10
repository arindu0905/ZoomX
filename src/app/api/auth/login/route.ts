import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { loginSchema } from "@/lib/account-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { startCustomerSession } from "@/services/auth/session";
import { wpLogin } from "@/services/auth/wordpress-auth";

export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const body = await readJson(request, loginSchema);
  if ("response" in body) return body.response;
  const ip = clientIp(request.headers);
  // Per IP and per account, to slow both spraying and targeted guessing.
  if (!rateLimit(`login:ip:${ip}`, 20, 15 * 60_000) || !rateLimit(`login:acct:${body.data.email}`, 8, 15 * 60_000)) {
    return apiError(429, "rate_limited", "Too many sign-in attempts. Please wait 15 minutes and try again.");
  }
  try {
    const customer = await wpLogin(body.data.email, body.data.password);
    await startCustomerSession(customer.id);
    return apiOk({ ok: true });
  } catch (err) {
    return handleApiError("login", err);
  }
}
