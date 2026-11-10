import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center py-section text-center">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">404</p>
      <h1 className="mt-3 text-headline text-balance">This page isn’t here.</h1>
      <p className="mt-4 max-w-prose text-lead text-ink-muted">
        The page you’re looking for may have moved, or isn’t available yet.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/shop" variant="secondary">
          Browse products
        </ButtonLink>
      </div>
    </Container>
  );
}
