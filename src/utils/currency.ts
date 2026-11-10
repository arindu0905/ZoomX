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

/**
 * Formats a decimal amount string as returned by the WooCommerce REST API v3
 * (e.g. "1250.00") — used for orders, where v3 is the source.
 */
export function formatDecimalPrice(amount: string, currencyCode = "LKR", decimals = 2): string {
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (!m) throw new TypeError(`Invalid decimal amount: ${amount}`);
  const frac = (m[3] ?? "").padEnd(decimals, "0").slice(0, decimals);
  const minor = Number.parseInt(`${m[1]}${m[2]}${frac}`, 10);
  return formatPrice({ amount: minor, minorUnit: decimals, currencyCode });
}
