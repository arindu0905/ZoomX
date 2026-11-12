export default function Loading() {
  return (
    <div aria-hidden className="animate-pulse space-y-4 motion-reduce:animate-none">
      <div className="h-8 w-48 rounded-lg bg-black/5" />
      <div className="h-40 rounded-2xl bg-black/5" />
      <div className="h-64 rounded-2xl bg-black/5" />
    </div>
  );
}
