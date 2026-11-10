import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { AutoRefresh } from "@/components/checkout/auto-refresh";
import { Container } from "@/components/ui/layout";
import { PAYHERE_METHOD_ID } from "@/services/payments/payhere-notify";
import { getOrderWithKey } from "@/services/woocommerce/orders";
import { ORDER_STATUS_LABEL, type Order } from "@/types/order";
import { formatDecimalPrice } from "@/utils/currency";
import { decodeEntities } from "@/utils/text";

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
  const fmt = (amount: string) => formatDecimalPrice(amount, order.currency);
  const status = ORDER_STATUS_LABEL[order.status] ?? order.status;
  const date = new Intl.DateTimeFormat("en-LK", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Colombo",
  }).format(new Date(`${order.date_created}+05:30`));

  return (
    <div className="mx-auto max-w-3xl">
      <PaymentHeader order={order} cancelled={cancelled === "1"} />
      {awaitingPayment && cancelled !== "1" && <AutoRefresh />}

      <dl className="mt-12 grid grid-cols-2 gap-6 rounded-3xl bg-canvas-alt p-6 sm:grid-cols-4 sm:p-8">
        <Fact label="Order number" value={`#${order.number}`} />
        <Fact label="Date" value={date} />
        <Fact label="Status" value={status} />
        <Fact label="Payment" value={decodeEntities(order.payment_method_title)} />
      </dl>

      {order.payment_method === "cod" && (
        <p className="mt-6 rounded-2xl bg-brand-tint px-5 py-4 text-body text-brand-strong">
          Please have <strong>{fmt(order.total)}</strong> ready in cash when your order is delivered.
        </p>
      )}

      <section aria-labelledby="items-title" className="mt-12">
        <h2 id="items-title" className="text-title">
          Items
        </h2>
        <ul className="mt-4 divide-y divide-line">
          {order.line_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-4 text-body">
              <span>
                {decodeEntities(item.name)} <span className="text-ink-muted">× {item.quantity}</span>
              </span>
              <span className="tabular-nums">{fmt(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <Totals order={order} fmt={fmt} />
      </section>

      <section aria-labelledby="delivery-title" className="mt-12 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 id="delivery-title" className="text-lg font-semibold">
            Delivery address
          </h2>
          <Address a={order.shipping.address_1 ? order.shipping : order.billing} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="mt-2 text-body text-ink-muted">
            {order.billing.email}
            <br />
            {order.billing.phone}
          </p>
          {order.customer_note && (
            <>
              <h3 className="mt-4 text-body font-semibold">Note</h3>
              <p className="mt-1 text-body text-ink-muted">{order.customer_note}</p>
            </>
          )}
        </div>
      </section>

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
      </div>
    </div>
  );
}

function Totals({ order, fmt }: { order: Order; fmt: (a: string) => string }) {
  const positive = (v: string) => Number.parseFloat(v) > 0;
  return (
    <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-body">
      {positive(order.discount_total) && (
        <div className="flex justify-between">
          <dt className="text-ink-muted">
            Discount
            {order.coupon_lines.length ? ` (${order.coupon_lines.map((c) => c.code.toUpperCase()).join(", ")})` : ""}
          </dt>
          <dd className="text-brand-strong tabular-nums">−{fmt(order.discount_total)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-muted">
          Delivery{order.shipping_lines[0] ? ` (${decodeEntities(order.shipping_lines[0].method_title)})` : ""}
        </dt>
        <dd className="tabular-nums">{fmt(order.shipping_total)}</dd>
      </div>
      {positive(order.total_tax) && (
        <div className="flex justify-between">
          <dt className="text-ink-muted">Tax</dt>
          <dd className="tabular-nums">{fmt(order.total_tax)}</dd>
        </div>
      )}
      <div className="mt-2 flex items-baseline justify-between">
        <dt className="text-lg font-semibold">Total</dt>
        <dd className="text-title tabular-nums">{fmt(order.total)}</dd>
      </div>
    </dl>
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-ink-muted">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function Address({ a }: { a: Order["billing"] }) {
  const lines = [
    `${a.first_name} ${a.last_name}`.trim(),
    a.address_1,
    a.address_2,
    [a.city, a.state].filter(Boolean).join(", "),
    a.postcode,
  ].filter(Boolean);
  return (
    <address className="mt-2 text-body not-italic text-ink-muted">
      {lines.map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </address>
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
