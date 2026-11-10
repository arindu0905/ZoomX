import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/account/auth-forms";
import { Container } from "@/components/ui/layout";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function ForgotPage() {
  return (
    <Container className="max-w-xl py-12 sm:py-16">
      <h1 className="text-headline">Reset your password.</h1>
      <p className="mt-3 mb-8 text-lead text-ink-muted">Enter your email and we’ll send you a reset link.</p>
      <ForgotForm />
      <Link href="/account" className="mt-8 inline-block text-body text-brand-strong hover:underline">
        ← Back to sign in
      </Link>
    </Container>
  );
}
