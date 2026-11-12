/** Formats a WooCommerce REST decimal amount ("650.00") for display. Never used for calculations. */
export function adminMoney(amount: string | number, currency = "LKR"): string {
  const n = typeof amount === "number" ? amount : Number.parseFloat(amount || "0");
  return new Intl.NumberFormat("en-LK", { style: "currency", currency, currencyDisplay: "code" })
    .format(Number.isFinite(n) ? n : 0)
    .replace(/ /g, " ");
}

export function adminDate(iso: string): string {
  // WooCommerce returns site-local times without a zone; show them as given.
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-LK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, string> = {
  processing: "bg-[#e3f1fd] text-[#0b5394]",
  completed: "bg-brand-tint text-brand-strong",
  "on-hold": "bg-[#fff4d6] text-[#7a5200]",
  pending: "bg-canvas-alt text-ink-muted",
  cancelled: "bg-canvas-alt text-ink-muted",
  refunded: "bg-canvas-alt text-ink-muted",
  failed: "bg-[#fdecec] text-danger",
  publish: "bg-brand-tint text-brand-strong",
  draft: "bg-canvas-alt text-ink-muted",
  private: "bg-canvas-alt text-ink-muted",
  instock: "bg-brand-tint text-brand-strong",
  outofstock: "bg-[#fdecec] text-danger",
  onbackorder: "bg-[#fff4d6] text-[#7a5200]",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending payment",
  processing: "Processing",
  "on-hold": "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
  publish: "Published",
  draft: "Draft",
  private: "Private",
  instock: "In stock",
  outofstock: "Out of stock",
  onbackorder: "On backorder",
};

export const statusLabel = (s: string) => STATUS_LABELS[s] ?? s;
export const statusClass = (s: string) => STATUS_STYLES[s] ?? "bg-canvas-alt text-ink-muted";
