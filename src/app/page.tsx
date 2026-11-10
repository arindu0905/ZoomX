import { site } from "@/lib/site";

// Temporary foundation page — replaced by the homepage in Phase 4.
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas-alt px-4 text-center">
      <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">{site.name}</h1>
      <p className="text-lg text-ink-muted md:text-2xl">{site.tagline}</p>
    </main>
  );
}
