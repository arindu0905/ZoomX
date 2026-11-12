import type { Metadata } from "next";
import Link from "next/link";
import { TrackForm } from "@/components/account/auth-forms";
import { Container } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your ZOOM X order with your order number and email.",
};

export default function TrackPage() {
  return (
    <Container className="max-w-xl py-12 sm:py-16">
      <h1 className="text-headline">Track your order.</h1>
      <p className="mt-3 mb-8 text-lead text-ink-muted">Enter your order number and the email you used at checkout.</p>
      <TrackForm />
      <p className="mt-8 text-body text-ink-muted">
        Have an account?{" "}
        <Link href="/account/orders" className="text-brand-strong underline underline-offset-4">
          See all your orders
        </Link>
      </p>
    </Container>
  );
}
