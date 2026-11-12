import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { AutoRefresh } from "@/components/checkout/auto-refresh";
import { Container } from "@/components/ui/layout";
import { PAYHERE_METHOD_ID } from "@/services/payments/payhere-notify";
import { OrderDetails } from "@/components/orders/order-details";
import { getOrderWithKey } from "@/services/woocommerce/orders";
import type { Order } from "@/types/order";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // keep the order key out of Referer headers
};

/**
 * Order confirmation, read live from WooCommerce on every request. Access
 * requires the order's secret key (like WooCommerce's "order received"
 * page). Nothing here comes from the checkout response or the browser.
 */
export default function OrderConfirmationPage(props: PageProps<"/checkout/order/[id]">) {
  return (
    <Container className="py-12 sm:py-16">
      <Suspense fallback={<p className="py-16 text-center text-body text-ink-muted">Loading your order…</p>}>
        <Confirmation {...props} />
      </Suspense>
    </Container>
  );
}

async function Confirmation({ params, searchParams }: PageProps<"/checkout/order/[id]">) {
  const { id } = await params;
  const { key } = await searchParams;
  const order = await getOrderWithKey(Number(id), typeof key === "string" ? key : "");
  if (!order) return <NotAvailable />;

  const { cancelled } = await searchParams;
  const awaitingPayment = order.payment_method === PAYHERE_METHOD_ID && order.status === "pending";

  return (
    <div className="mx-auto max-w-3xl">
      <PaymentHeader order={order} cancelled={cancelled === "1"} />
      {awaitingPayment && cancelled !== "1" && <AutoRefresh />}
      <OrderDetails order={order} />

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
      </div>
    </div>
  );
}

/**
 * Wording follows the order's real status in WooCommerce. A PayHere order is
 * only "paid" once our verified notification handler has updated it — the
 * customer returning here proves nothing on its own.
 */
function PaymentHeader({ order, cancelled }: { order: Order; cancelled: boolean }) {
  const payhere = order.payment_method === PAYHERE_METHOD_ID;
  const payAgain = `/checkout/pay/${order.id}?key=${encodeURIComponent(order.order_key)}`;
  const name = order.billing.first_name;

  if (payhere && order.status === "pending") {
    return cancelled ? (
      <Header
        icon={<XCircle aria-hidden className="size-12 text-ink-muted" strokeWidth={1.5} />}
        title="Payment cancelled."
      >
        <p className="text-lead text-ink-muted">
          Order <strong className="text-ink">#{order.number}</strong> is saved but not paid. You can try again.
        </p>
        <ButtonLink href={payAgain} size="lg">
          Pay now
        </ButtonLink>
      </Header>
    ) : (
      <Header
        icon={<Clock aria-hidden className="size-12 text-brand-strong" strokeWidth={1.5} />}
        title="Confirming your payment…"
      >
        <p className="text-lead text-ink-muted" role="status">
          We’re waiting for PayHere to confirm payment for order <strong className="text-ink">#{order.number}</strong>.
          This page updates automatically.
        </p>
        <p className="text-body text-ink-muted">
          Didn’t complete the payment?{" "}
          <a href={payAgain} className="text-brand-strong underline underline-offset-4">
            Pay now
          </a>
        </p>
      </Header>
    );
  }
  if (order.status === "failed" || order.status === "cancelled") {
    return (
      <Header
        icon={<XCircle aria-hidden className="size-12 text-danger" strokeWidth={1.5} />}
        title={order.status === "failed" ? "Payment unsuccessful." : "Order cancelled."}
      >
        <p className="text-lead text-ink-muted">
          Order <strong className="text-ink">#{order.number}</strong> was not paid. No money has been taken by us;
          please contact us if you were charged.
        </p>
        <ButtonLink href="/shop" variant="secondary">
          Continue shopping
        </ButtonLink>
      </Header>
    );
  }
  if (order.status === "on-hold") {
    return (
      <Header
        icon={<Clock aria-hidden className="size-12 text-ink-muted" strokeWidth={1.5} />}
        title={`Thank you, ${name}.`}
      >
        <p className="text-lead text-ink-muted">
          Order <strong className="text-ink">#{order.number}</strong> is on hold while we review it. We’ll be in touch.
        </p>
      </Header>
    );
  }
  return (
    <Header
      icon={<CheckCircle2 aria-hidden className="size-12 text-brand-strong" strokeWidth={1.5} />}
      title={`Thank you, ${name}.`}
    >
      <p className="text-lead text-ink-muted">
        {payhere ? "Your payment is confirmed and your order " : "Your order "}
        <strong className="text-ink">#{order.number}</strong> has been received.
      </p>
    </Header>
  );
}

function Header({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      {icon}
      <h1 className="text-headline text-balance">{title}</h1>
      {children}
    </header>
  );
}

function NotAvailable() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-headline">We can’t show this order.</h1>
      <p className="max-w-prose text-lead text-ink-muted">
        The link may be incomplete or expired. Your order confirmation email has the details.
      </p>
      <ButtonLink href="/shop" variant="secondary">
        Continue shopping
      </ButtonLink>
    </div>
  );
}
