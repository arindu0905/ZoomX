import type { StorePrices } from "@/types/store-api";
import { formatPrice } from "@/utils/currency";
import { cn } from "@/utils/cn";

/** Renders WooCommerce-supplied prices only — never computes them. */
export function Price({ prices, onSale, className }: { prices: StorePrices; onSale: boolean; className?: string }) {
  const fmt = (amount: string) =>
    formatPrice({ amount, minorUnit: prices.currency_minor_unit, currencyCode: prices.currency_code });
  const range = prices.price_range;

  // No price yet (preview catalogue before the live store is connected).
  if (prices.price === "") {
    return <p className={cn("font-medium text-ink-muted", className)}>Price coming soon</p>;
  }

  if (range && range.min_amount !== range.max_amount) {
    return (
      <p className={className}>
        From <span className="font-semibold text-ink">{fmt(range.min_amount)}</span>
      </p>
    );
  }

  if (onSale && prices.regular_price !== prices.price) {
    return (
      <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
        <span className="font-semibold text-danger">
          <span className="sr-only">Sale price </span>
          {fmt(prices.price)}
        </span>
        <s className="text-ink-muted">
          <span className="sr-only">Regular price </span>
          {fmt(prices.regular_price)}
        </s>
      </p>
    );
  }

  return <p className={cn("font-semibold text-ink", className)}>{fmt(prices.price)}</p>;
}
