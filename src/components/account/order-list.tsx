import Link from "next/link";
import { formatOrderDate } from "@/components/orders/order-details";
import { ORDER_STATUS_LABEL, type Order } from "@/types/order";
import { formatDecimalPrice } from "@/utils/currency";

export function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <p className="rounded-3xl bg-canvas-alt px-6 py-12 text-center text-body text-ink-muted">
        You haven’t placed any orders yet.{" "}
        <Link href="/shop" className="text-brand-strong underline underline-offset-4">
          Start shopping
        </Link>
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {orders.map((o) => (
        <li key={o.id}>
          <Link
            href={`/account/orders/${o.id}`}
            className="-mx-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-2xl px-3 py-4 hover:bg-canvas-alt sm:grid-cols-4 sm:items-center"
          >
            <span className="font-semibold">Order #{o.number}</span>
            <span className="text-right text-body text-ink-muted sm:text-left">{formatOrderDate(o.date_created)}</span>
            <span className="text-body">{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
            <span className="text-right font-semibold tabular-nums">{formatDecimalPrice(o.total, o.currency)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
