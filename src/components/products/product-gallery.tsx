"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { StoreImage } from "@/types/store-api";
import { cn } from "@/utils/cn";
import { Morph } from "./product-card";

/** Large primary image with thumbnail switcher. The image is the focus of the page. */
export function ProductGallery({
  images,
  name,
  style,
  morphName,
}: {
  images: StoreImage[];
  name: string;
  /** Pairs the first photo with the product card it was opened from (see ProductCard). */
  morphName?: string;
  /** Tint variables for the image wells (utils/tint.ts). */
  style?: CSSProperties;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[active];

  return (
    <div style={style} className="flex flex-col gap-4">
      <div
        data-product-image
        className={cn(
          "tint-surface relative aspect-square overflow-hidden rounded-[10%]",
          current && "[@media(hover:hover)]:cursor-zoom-in",
        )}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
      >
        {current ? (
          <Morph name={active === 0 ? morphName : undefined}>
          <Image
            key={current.id}
            src={current.src}
            alt={current.alt || name}
            fill
            priority={active === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            className={cn(
              !(active === 0 && morphName) && "animate-[zx-rise_0.5s_var(--ease-standard)_both]",
              "object-contain p-10 drop-shadow-[0_30px_30px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-standard sm:p-16 motion-reduce:transition-none",
              zoom && "scale-[1.9]",
            )}
          />
          </Morph>
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
                  "relative block size-20 overflow-hidden rounded-[10%] bg-(--tint,var(--color-canvas-alt)) ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-strong",
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
