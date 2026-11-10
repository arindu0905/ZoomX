"use client";

import Image from "next/image";
import { useState } from "react";
import type { StoreImage } from "@/types/store-api";
import { cn } from "@/utils/cn";

/** Large primary image with thumbnail switcher. The image is the focus of the page. */
export function ProductGallery({ images, name }: { images: StoreImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-[32px] bg-canvas-alt">
        {current ? (
          <Image
            key={current.id}
            src={current.src}
            alt={current.alt || name}
            fill
            priority={active === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-contain p-10 sm:p-16"
          />
        ) : (
          <div aria-hidden className="flex h-full items-center justify-center text-body text-ink-muted">
            Image coming soon
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto pb-1" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={cn(
                  "relative block size-20 overflow-hidden rounded-2xl bg-canvas-alt ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong",
                  i === active ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={img.thumbnail ?? img.src} alt="" fill sizes="80px" className="object-contain p-2" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
