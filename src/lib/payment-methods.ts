/**
 * Payment methods the storefront knows how to complete. A method is offered
 * only if it is listed here AND enabled in WooCommerce (the cart's
 * `payment_methods`). Gateway integrations (PayHere, WEBXPAY) are added in
 * Phase 8 once their flows and credentials exist.
 */
export const PAYMENT_METHODS = {
  cod: {
    label: "Cash on delivery",
    description: "Pay in cash when your order is delivered.",
  },
} as const satisfies Record<string, { label: string; description: string }>;

export type PaymentMethodId = keyof typeof PAYMENT_METHODS;

export const isSupportedPaymentMethod = (id: string): id is PaymentMethodId => Object.hasOwn(PAYMENT_METHODS, id);
