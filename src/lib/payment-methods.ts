/**
 * Payment methods the storefront knows how to complete. A method is offered
 * only if it is listed here, configured on the storefront (credentials, see
 * services/payments/methods.ts) AND enabled in WooCommerce (the cart's
 * `payment_methods`).
 */
export const PAYMENT_METHODS = {
  cod: {
    label: "Cash on delivery",
    description: "Pay in cash when your order is delivered.",
  },
  zoomx_payhere: {
    label: "Card or mobile wallet",
    description:
      "Pay securely with PayHere (Visa, Mastercard, Amex and local wallets). You’ll be taken to PayHere to pay.",
  },
} as const satisfies Record<string, { label: string; description: string }>;

export type PaymentMethodId = keyof typeof PAYMENT_METHODS;

export const isKnownPaymentMethod = (id: string): id is PaymentMethodId => Object.hasOwn(PAYMENT_METHODS, id);
