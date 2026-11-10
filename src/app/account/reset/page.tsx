import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetForm } from "@/components/account/auth-forms";
import { Container } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // keep the reset key out of Referer headers
};

export default function ResetPage(props: PageProps<"/account/reset">) {
  return (
    <Container className="max-w-xl py-12 sm:py-16">
      <h1 className="text-headline">Choose a new password.</h1>
      <div className="mt-8">
        <Suspense fallback={null}>
          <Reset {...props} />
        </Suspense>
      </div>
    </Container>
  );
}

async function Reset({ searchParams }: PageProps<"/account/reset">) {
  const { key, login } = await searchParams;
  if (typeof key !== "string" || typeof login !== "string" || !key || !login) {
    return (
      <p className="text-body text-ink-muted">
        This reset link is incomplete.{" "}
        <Link href="/account/forgot" className="text-brand-strong underline underline-offset-4">
          Request a new one
        </Link>
        .
      </p>
    );
  }
  // WordPress validates the key when the new password is submitted.
  return <ResetForm login={login} resetKey={key} />;
}
