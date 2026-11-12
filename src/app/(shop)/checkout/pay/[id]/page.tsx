import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PayHereRedirect } from "@/components/checkout/payhere-redirect";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { buildPayHereForm, getPayHereConfig } from "@/services/payments/payhere";
import { PAYHERE_METHOD_ID } from "@/services/payments/payhere-notify";
import { getOrderWithKey } from "@/services/woocommerce/orders";
import { formatDecimalPrice } from "@/utils/currency";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false, follow: false },
  // PayHere checks the Referer against the registered domain — don't suppress it.
  referrer: "strict-origin-when-cross-origin",
};

/**
 * Hands the customer to PayHere for an existing, still-unpaid order. The form
 * is built from the order as stored in WooCommerce and signed on the server.
 */
export default function PayPage(props: PageProps<"/checkout/pay/[id]">) {
  return (
    <Container className="py-16 sm:py-24">
      <Suspense fallback={<p className="text-center text-body text-ink-muted">Preparing your payment…</p>}>
        <Pay {...props} />
      </Suspense>
    </Container>
  );
}

async function Pay({ params, searchParams }: PageProps<"/checkout/pay/[id]">) {
  const { id } = await params;
  const { key } = await searchParams;
  const orderKey = typeof key === "string" ? key : "";
  const order = await getOrderWithKey(Number(id), orderKey);
  const config = getPayHereConfig();

  if (!order || order.payment_method !== PAYHERE_METHOD_ID || !config) {
    return (
      <Message
        title="This payment link isn’t valid."
        body="Please check the link, or contact us for help with your order."
      />
    );
  }
  const confirmation = `/checkout/order/${order.id}?key=${encodeURIComponent(order.order_key)}`;
  if (order.status !== "pending") redirect(confirmation); // paid, failed or cancelled — the confirmation page explains

  const { action, fields } = buildPayHereForm(order, config);
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
      <Lock aria-hidden className="size-10 text-brand-strong" strokeWidth={1.5} />
      <h1 className="text-headline">Taking you to PayHere…</h1>
      <p className="text-lead text-ink-muted">
        Order #{order.number} · <strong className="text-ink">{formatDecimalPrice(order.total, order.currency)}</strong>
      </p>
      <PayHereRedirect action={action} fields={fields} />
      {config.mode === "sandbox" && (
        <p className="rounded-full bg-canvas-alt px-4 py-1.5 text-caption text-ink-muted">
          PayHere sandbox — no real charge
        </p>
      )}
    </div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-headline">{title}</h1>
      <p className="max-w-prose text-lead text-ink-muted">{body}</p>
      <ButtonLink href="/shop" variant="secondary">
        Continue shopping
      </ButtonLink>
    </div>
  );
}
