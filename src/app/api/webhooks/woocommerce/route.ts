import { revalidateTag } from "next/cache";
import { staffActiveRecently } from "@/services/admin/session";
import { warmAdminSoon } from "@/services/admin/warm";
import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api-route";
import { getServerEnv } from "@/lib/env";
import { tagsForWebhook } from "@/lib/revalidation";
import { verifyWooWebhookSignature } from "@/lib/security";

const MAX_BODY = 1_000_000; // 1 MB — WooCommerce product/order payloads are far smaller

/**
 * WooCommerce → cache invalidation.
 * Configure in WooCommerce → Settings → Advanced → Webhooks with delivery URL
 * `${NEXT_PUBLIC_SITE_URL}/api/webhooks/woocommerce` and the secret from
 * WOOCOMMERCE_WEBHOOK_SECRET. Topics: product created/updated/deleted/restored,
 * order created/updated.
 *
 * Revalidation is idempotent, so duplicate deliveries are harmless.
 */
export async function POST(request: NextRequest) {
  const secret = getServerEnv().WOOCOMMERCE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] WOOCOMMERCE_WEBHOOK_SECRET is not configured");
    return apiError(503, "unavailable", "Webhook endpoint not configured.");
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY) return apiError(413, "too_large", "Payload too large.");
  const raw = await request.text();
  if (raw.length > MAX_BODY) return apiError(413, "too_large", "Payload too large.");

  const topic = request.headers.get("x-wc-webhook-topic");

  // WooCommerce sends an unsigned `webhook_id=<n>` ping when a webhook is saved.
  // Acknowledge it without doing anything.
  if (!topic && /^webhook_id=\d+$/.test(raw.trim())) return apiOk({ ok: true, ping: true });

  if (!verifyWooWebhookSignature(raw, request.headers.get("x-wc-webhook-signature"), secret)) {
    return apiError(401, "invalid_signature", "Invalid signature.");
  }
  if (!topic) return apiError(400, "invalid_request", "Missing topic.");

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return apiError(400, "invalid_json", "Invalid payload.");
  }

  const tags = tagsForWebhook(topic, payload);
  // expire: 0 → the next visitor gets fresh price/stock rather than stale-while-revalidate.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  if (staffActiveRecently()) warmAdminSoon();

  console.info(`[webhook] ${topic} → ${tags.join(", ") || "no-op"}`);
  return apiOk({ ok: true, revalidated: tags });
}
