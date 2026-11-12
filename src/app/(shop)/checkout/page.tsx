import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Container } from "@/components/ui/layout";
import { getConfiguredPaymentMethods } from "@/services/payments/methods";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-10 text-display">Checkout.</h1>
      <CheckoutForm configuredMethods={getConfiguredPaymentMethods()} />
    </Container>
  );
}
