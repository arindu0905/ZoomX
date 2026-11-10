import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";
import { MissingConfigurationError } from "@/lib/env";
import { isSameOriginRequest } from "@/lib/security";
import { AuthError } from "@/services/auth/wordpress-auth";
import { CartApiError } from "@/services/woocommerce/cart";
import { StoreApiError } from "@/services/woocommerce/store-api";

/** Customer-specific responses: never cached by browsers, CDNs or Next.js. */
const PRIVATE = { "Cache-Control": "private, no-store" };

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status, headers: PRIVATE });
}

export function apiOk<T>(body: T, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE });
}

/** Maps thrown errors to safe responses; details go to the server log only. */
export function handleApiError(label: string, err: unknown) {
  if (err instanceof CartApiError) {
    // WooCommerce's own customer-facing message (e.g. out of stock).
    const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 502;
    return apiError(status, err.code, err.message);
  }
  if (err instanceof AuthError) {
    // Messages are the plugin's generic customer-facing ones (or our own).
    return apiError(err.status >= 400 && err.status < 600 ? err.status : 502, err.code, err.message);
  }
  if (err instanceof MissingConfigurationError) {
    console.error(`[api] ${label}: missing configuration ${err.keys.join(", ")}`);
    return apiError(503, "unavailable", "The shop is temporarily unavailable.");
  }
  const status = err instanceof StoreApiError && err.status === 503 ? 503 : 502;
  console.error(`[api] ${label}:`, err instanceof Error ? err.message : "unknown error");
  return apiError(status, "upstream_error", "We couldn’t reach the shop. Please try again.");
}

/** CSRF + content-type guard for cookie-authenticated mutations. */
export function guardMutation(request: NextRequest): NextResponse | null {
  if (!isSameOriginRequest(request.headers, request.nextUrl.origin)) {
    return apiError(403, "forbidden", "Request not allowed.");
  }
  const type = request.headers.get("content-type") ?? "";
  if (request.method !== "DELETE" && !type.toLowerCase().startsWith("application/json")) {
    return apiError(415, "unsupported_media_type", "Expected JSON.");
  }
  return null;
}

/** Parses and validates a JSON body. */
export async function readJson<S extends z.ZodType>(
  request: NextRequest,
  schema: S,
): Promise<{ data: z.infer<S> } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: apiError(400, "invalid_json", "Invalid request body.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { response: apiError(400, "invalid_request", "Invalid request.") };
  return { data: parsed.data };
}
