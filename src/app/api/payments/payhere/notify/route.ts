import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPayHereConfig } from "@/services/payments/payhere";
import { processPayHereNotification } from "@/services/payments/payhere-notify";
import { addOrderNote, getOrder, updateOrder } from "@/services/woocommerce/orders";

const MAX_BODY = 20_000;

const notificationSchema = z.object({
  merchant_id: z.string().max(40),
  order_id: z.string().max(40),
  payment_id: z.string().max(40),
  payhere_amount: z.string().max(20),
  payhere_currency: z.string().max(5),
  status_code: z.string().max(5),
  md5sig: z.string().regex(/^[A-Fa-f0-9]{32}$/),
  status_message: z.string().max(500).optional(),
  method: z.string().max(30).optional(),
});

/**
 * PayHere server-to-server notification (application/x-www-form-urlencoded).
 * This — not the customer's return to the site — is the only thing that can
 * mark an order paid, and only after md5sig verification and an amount check
 * against the WooCommerce order. Plain-text responses; no details leak.
 */
export async function POST(request: NextRequest) {
  const config = getPayHereConfig();
  if (!config) {
    console.error("[payhere] notification received but PayHere is not configured");
    return new NextResponse("unavailable", { status: 503 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new NextResponse("too large", { status: 413 });
  const parsed = notificationSchema.safeParse(Object.fromEntries(new URLSearchParams(raw)));
  if (!parsed.success) return new NextResponse("bad request", { status: 400 });

  try {
    const outcome = await processPayHereNotification(parsed.data, {
      merchantId: config.merchantId,
      secret: config.secret,
      getOrder,
      updateOrder,
      addNote: addOrderNote,
    });
    // Log ids and outcome only — never card data or the signature.
    const detail = outcome.result === "rejected" ? ` (${outcome.reason})` : "";
    console.info(
      `[payhere] order ${parsed.data.order_id} status ${parsed.data.status_code} → ${outcome.result}${detail}`,
    );
    return new NextResponse(outcome.result === "rejected" ? "rejected" : "ok", { status: outcome.http });
  } catch (err) {
    // 5xx lets PayHere retry if it does; processing is idempotent.
    console.error("[payhere] processing error:", err instanceof Error ? err.message : "unknown error");
    return new NextResponse("error", { status: 500 });
  }
}
