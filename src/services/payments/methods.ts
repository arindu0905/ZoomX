import "server-only";
import type { PaymentMethodId } from "@/lib/payment-methods";
import { isPayHereConfigured } from "./payhere";

/** Methods the storefront can complete right now (credentials present). */
export function getConfiguredPaymentMethods(): PaymentMethodId[] {
  const methods: PaymentMethodId[] = ["cod"];
  if (isPayHereConfigured()) methods.push("zoomx_payhere");
  return methods;
}
