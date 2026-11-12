import { range } from "@/content/home";

/** Endless strip of the product range between the hero and the showcase. Pure CSS; pauses on hover. */
export function RangeTicker() {
  const names = range.products;
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10 pr-10">
      {names.map((n) => (
        <li key={n} className="flex items-center gap-10 text-[clamp(1.25rem,1rem+1vw,2rem)] font-semibold tracking-tight whitespace-nowrap">
          {n}
          <span aria-hidden className="size-2 rounded-full bg-brand-strong" />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="The ZOOM X range" className="group overflow-hidden border-y border-line bg-canvas py-5">
      <div className="ticker flex w-max group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
