import { ArrowRight, Check } from "lucide-react";
import type React from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { Reveal, Words } from "@/components/ui/reveal";
import { business as defaultBusiness } from "@/content/home";

/** Promotional campaign band — currently the real For Businesses offer. */
export function BusinessCampaign({ business = defaultBusiness }: { business?: typeof defaultBusiness }) {
  return (
    <section aria-labelledby="business-title" className="bg-canvas py-section">
      <Container>
        <Reveal>
          <div className="relative isolate overflow-clip rounded-tile bg-ink px-8 py-16 text-white md:px-16 md:py-24">
            {/* Depth: two soft lights and a faint grid, fading toward the copy */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <span className="aurora absolute -top-1/3 -right-[10%] size-[70%] rounded-full bg-[#0a8f2c] opacity-45 blur-[110px]" />
              <span
                style={{ "--i": 1 } as React.CSSProperties}
                className="aurora absolute -bottom-1/2 left-[5%] size-[55%] rounded-full bg-[#1f5fd1] opacity-30 blur-[120px]"
              />
              <span className="absolute inset-0 [background-image:linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(90%_90%_at_100%_0%,black,transparent)]" />
            </div>
            <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-end">
              <div>
                <p className="text-caption font-semibold uppercase tracking-[0.12em] text-[#5fd97d]">{business.eyebrow}</p>
                <h2 id="business-title" className="mt-4 text-headline text-balance">
                  <Words text={business.title} />
                </h2>
                <p className="mt-5 max-w-prose text-lead text-pretty text-white/70">{business.lead}</p>
              </div>
              <div>
                <ul className="space-y-3">
                  {business.points.map((p) => (
                    <li
                      key={p}
                      className="flex gap-3 rounded-2xl bg-white/[0.06] px-4 py-3.5 text-body text-white/90 ring-1 ring-white/10 backdrop-blur-sm"
                    >
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-[#5fd97d]" strokeWidth={2.5} />
                      {p}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  href={business.cta.href}
                  variant="ghost"
                  size="lg"
                  className="mt-8 bg-white text-ink hover:bg-white/90"
                >
                  {business.cta.label} <ArrowRight aria-hidden className="size-4" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
