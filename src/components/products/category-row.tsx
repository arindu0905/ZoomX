import Image from "next/image";
import Link from "next/link";
import { categoryHref } from "@/lib/navigation";
import type { StoreCategory } from "@/types/store-api";
import { cn } from "@/utils/cn";
import { decodeEntities } from "@/utils/text";

/** apple.com/store-style category row: packshot above a short label, scrolls sideways on small screens. */
export function CategoryRow({
  categories,
  active,
  className,
}: {
  categories: StoreCategory[];
  active?: string;
  className?: string;
}) {
  if (!categories.length) return null;
  return (
    <nav aria-label="Categories" className={className}>
      <ul className="flex min-w-0 max-w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0 snap-start">
            <Link
              href={categoryHref(c.slug)}
              aria-current={c.slug === active ? "page" : undefined}
              className={cn(
                "group flex w-28 flex-col items-center gap-2.5 rounded-card px-2 py-3 text-center sm:w-32",
                "aria-[current=page]:bg-canvas aria-[current=page]:shadow-card",
              )}
            >
              <span className="relative block h-24 w-full">
                {c.image && (
                  <Image
                    src={c.image.src}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-contain transition-transform duration-500 ease-standard group-hover:scale-105"
                  />
                )}
              </span>
              <span className="text-sm font-semibold tracking-tight">{decodeEntities(c.name)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
