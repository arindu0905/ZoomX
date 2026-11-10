/**
 * WooCommerce Store API returns prices as integer strings in minor units,
 * with `currency_minor_unit` describing the exponent (e.g. "125000", 2 → 1250.00).
 * We format from those values directly — never from client-computed floats.
 */
export interface StoreApiPrice {
  amount: string | number;
  minorUnit: number;
  currencyCode?: string;
}

export function formatPrice({ amount, minorUnit, currencyCode = "LKR" }: StoreApiPrice): string {
  const minor = typeof amount === "number" ? amount : Number.parseInt(amount, 10);
  if (!Number.isFinite(minor)) throw new TypeError(`Invalid price amount: ${String(amount)}`);
  if (!Number.isInteger(minorUnit) || minorUnit < 0) {
    throw new TypeError(`Invalid currency minor unit: ${String(minorUnit)}`);
  }
  const value = minor / 10 ** minorUnit;
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    minimumFractionDigits: minorUnit,
    maximumFractionDigits: minorUnit,
  })
    .format(value)
    .replace(/ /g, " ");
}
