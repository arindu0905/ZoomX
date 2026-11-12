import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { why as defaultWhy } from "@/content/home";

/** Four plain statements under hairlines that draw in as the section arrives. */
export function WhyZoomX({ why = defaultWhy }: { why?: typeof defaultWhy }) {
  return (
    <Section tone="alt" aria-labelledby="why-title">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={why.eyebrow} title={<span id="why-title">{why.title}</span>} />
        </Reveal>
        <ul className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {why.items.map((item, i) => (
            <li key={item.title} className="draw-scope group">
              <span aria-hidden className="relative block h-px bg-line">
                <span className="draw-in absolute inset-x-0 top-0 h-0.5 bg-ink transition-colors duration-300 group-hover:bg-brand-strong" />
              </span>
              <Reveal delay={i * 0.05}>
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
