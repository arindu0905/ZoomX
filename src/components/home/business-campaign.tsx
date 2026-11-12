import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { business as defaultBusiness } from "@/content/home";

/** Promotional campaign band — currently the real For Businesses offer. */
export function BusinessCampaign({ business = defaultBusiness }: { business?: typeof defaultBusiness }) {
  return (
    <section aria-labelledby="business-title" className="bg-canvas py-section">
      <Container>
        <Reveal>
          <div className="overflow-hidden rounded-tile bg-ink px-8 py-16 text-white md:px-16 md:py-20">
            <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-end">
              <div>
                <p className="text-caption font-semibold uppercase tracking-[0.12em] text-[#5fd97d]">{business.eyebrow}</p>
                <h2 id="business-title" className="mt-4 text-headline text-balance">
                  {business.title}
                </h2>
                <p className="mt-5 max-w-prose text-lead text-pretty text-white/70">{business.lead}</p>
              </div>
              <div>
                <ul className="space-y-4">
                  {business.points.map((p) => (
                    <li key={p} className="flex gap-3 text-body text-white/90">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-[#5fd97d]" strokeWidth={2.5} />
                      {p}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  href={business.cta.href}
                  variant="ghost"
                  size="lg"
                  className="mt-10 bg-white text-ink hover:bg-white/90"
                >
                  {business.cta.label}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
