import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { categoryHref } from "@/lib/navigation";
import type { StoreCategory } from "@/types/store-api";
import { decodeEntities } from "@/utils/text";
import { tintStyle } from "@/utils/tint";

/** Homepage category grid: one colour-washed card per category, packshot leaning out of the corner. */
export function CategoryCards({ categories }: { categories: StoreCategory[] }) {
  return (
    <ul className="mt-12 grid grid-cols-2 gap-tile-gap lg:grid-cols-3">
      {categories.map((c, i) => (
        <li key={c.id}>
          <Reveal delay={(i % 3) * 0.06} className="h-full">
            <Link
              href={categoryHref(c.slug)}
              style={tintStyle(c.slug)}
              className="group tint-surface relative flex h-full min-h-44 flex-col justify-between overflow-hidden rounded-card p-5 transition-shadow duration-300 ease-standard hover:shadow-card-hover sm:min-h-56 sm:p-7"
            >
              <span className="relative z-10 max-w-[62%]">
                <span className="block text-lg leading-tight font-semibold tracking-tight text-balance sm:text-title">
                  {decodeEntities(c.name)}
                </span>
                <span className="mt-1.5 block text-caption font-medium text-(--tint-ink) sm:text-sm">
                  {c.count} {c.count === 1 ? "product" : "products"}
                </span>
              </span>
              <span aria-hidden className="relative z-10 flex items-center gap-1 text-sm font-semibold text-ink">
                Shop
                <ArrowRight className="size-4 transition-transform duration-300 ease-emphasized group-hover:translate-x-1.5" />
              </span>
              {c.image && (
                <span className="absolute -right-[6%] -bottom-[10%] block h-[92%] w-[52%]">
                  <span aria-hidden className="tint-halo absolute inset-[-10%]" />
                  <Image
                    src={c.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 220px, 26vw"
                    className="rotate-6 object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.16)] transition-transform duration-500 ease-emphasized group-hover:scale-110 group-hover:rotate-0"
                  />
                </span>
              )}
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
