import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { why as defaultWhy } from "@/content/home";

export function WhyZoomX({ why = defaultWhy }: { why?: typeof defaultWhy }) {
  return (
    <Section tone="alt" aria-labelledby="why-title">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={why.eyebrow} title={<span id="why-title">{why.title}</span>} />
        </Reveal>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {why.items.map((item, i) => (
            <li key={item.title}>
              <Reveal delay={i * 0.06} className="h-full rounded-card bg-canvas p-8">
                <p aria-hidden className="text-caption font-semibold text-brand-strong tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-6 text-title">{item.title}</h3>
                <p className="mt-3 text-body text-ink-muted">{item.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
