import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/layout";
import { Reveal } from "@/components/ui/reveal";
import { story } from "@/content/home";

export function BrandStory() {
  return (
    <Section aria-labelledby="story-title">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="text-caption font-semibold uppercase tracking-[0.12em] text-brand-strong">{story.eyebrow}</p>
            <h2 id="story-title" className="mt-4 text-headline text-balance">
              {story.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="space-y-5 text-lead text-pretty text-ink-muted">
            {story.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <ButtonLink href={story.cta.href} variant="link" className="text-lead">
              {story.cta.label} <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </Reveal>
        </div>

        <ul className="mt-20 grid gap-x-10 gap-y-12 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-4">
          {story.values.map((v, i) => (
            <li key={v.title}>
              <Reveal delay={i * 0.06}>
                <h3 className="text-title">{v.title}</h3>
                <p className="mt-3 text-body text-ink-muted">{v.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
