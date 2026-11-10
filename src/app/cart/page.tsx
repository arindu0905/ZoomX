import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Container } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Your bag",
  robots: { index: false, follow: true },
};

/** Static shell; the customer's cart is loaded client-side from /api/cart (never cached). */
export default function CartPage() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-10 text-display">Bag.</h1>
      <CartView />
    </Container>
  );
}
