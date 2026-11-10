import type { NextRequest } from "next/server";
import { apiError, apiOk, guardMutation, handleApiError, readJson } from "@/lib/api-route";
import { registerSchema } from "@/lib/account-schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { startCustomerSession } from "@/services/auth/session";
import { wpRegister } from "@/services/auth/wordpress-auth";

export async function POST(request: NextRequest) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  if (!rateLimit(`register:${clientIp(request.headers)}`, 10, 60 * 60_000)) {
    return apiError(429, "rate_limited", "Too many attempts. Please try again later.");
  }
  const body = await readJson(request, registerSchema);
  if ("response" in body) return body.response;
  try {
    const customer = await wpRegister(body.data);
    await startCustomerSession(customer.id);
    return apiOk({ ok: true }, 201);
  } catch (err) {
    return handleApiError("register", err);
  }
}
