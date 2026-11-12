import type React from "react";
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
      <ul className="flex min-w-0 max-w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [mask-image:linear-gradient(to_right,#000_85%,transparent)] [scrollbar-width:none] sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c, i) => (
          <li key={c.id} className="animate-rise shrink-0 snap-start" style={{ "--i": i + 2 } as React.CSSProperties}>
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
                    className="object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.12)] transition-transform duration-500 ease-emphasized group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95"
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
