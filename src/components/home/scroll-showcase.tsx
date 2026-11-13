"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { productHref } from "@/components/products/product-card";
import { Price } from "@/components/products/price";
import { buttonClasses } from "@/components/ui/button";
import type { StoreProduct } from "@/types/store-api";
import { decodeEntities, htmlToText } from "@/utils/text";
import { tint } from "@/utils/tint";

const ease = [0.22, 1, 0.36, 1] as const;
const compact = "max-sm:h-11 max-sm:px-5 max-sm:text-[0.9375rem]";

/**
 * Cinematic product showcase: the section pins to the viewport while the
 * visitor scrolls, and each scroll step brings the next bottle in — it
 * rises, turns and settles while its name and price slide alongside. Under
 * reduced motion it becomes a plain stacked list.
 */
export function ScrollShowcase({ products }: { products: StoreProduct[] }) {
  const items = products.filter((p) => p.images[0]).slice(0, 5);
  // Mount the scroll-driven part only when there is a section to track.
  return items.length < 2 ? null : <Showcase items={items} />;
}

function Showcase({ items }: { items: StoreProduct[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  const glowScale = useTransform(progress, [0, 1], [0.8, 1.25]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length)));
    setActive((cur) => (cur === i ? cur : i));
  });

  if (reduce) {
    return (
      <section aria-label="Product showcase" className="bg-canvas py-section">
        <ul className="mx-auto grid max-w-5xl gap-10 px-gutter sm:grid-cols-2">
          {items.map((p) => (
            <li key={p.id}>
              <Slide product={p} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const p = items[active];
  return (
    <section
      ref={ref}
      aria-label="Product showcase"
      style={{ height: `${items.length * 100}vh` }}
      className="relative"
    >
      <motion.div
        className="sticky top-0 flex h-dvh items-center overflow-hidden"
        animate={{ backgroundColor: tint(p.slug).soft }}
        transition={{ duration: 0.8, ease }}
      >
        {/* Soft moving glow behind the bottle */}
        <motion.div
          aria-hidden
          style={{ scale: glowScale }}
          className="pointer-events-none absolute top-1/2 left-1/2 size-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-3xl lg:left-[35%]"
        />
        <motion.div
          aria-hidden
          animate={{ backgroundColor: tint(p.slug).glow }}
          transition={{ duration: 0.8, ease }}
          className="pointer-events-none absolute -right-[20vmin] -bottom-[30vmin] size-[80vmin] rounded-full opacity-70 blur-[100px]"
        />

        <div className="relative mx-auto grid w-full max-w-[1024px] items-center gap-6 px-gutter lg:grid-cols-[1.1fr_1fr] lg:px-[22px]">
          <div className="relative h-[42vh] lg:h-[70vh]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={p.id}
                className="absolute inset-0"
                initial={{ opacity: 0, y: 120, rotate: -12, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, y: -120, rotate: 10, scale: 0.85 }}
                transition={{ duration: 0.75, ease }}
              >
                <motion.div
                  className="relative size-full"
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src={p.images[0].src}
                    alt={decodeEntities(p.name)}
                    fill
                    sizes="(min-width: 1024px) 560px, 80vw"
                    className="object-contain drop-shadow-[0_40px_40px_rgba(0,0,0,0.18)]"
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative min-h-56 text-center lg:text-left">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.45, ease }}
              >
                <Slide product={p} hideImage />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress rail */}
        <div aria-hidden className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex">
          {items.map((it, i) => (
            <motion.span
              key={it.id}
              className="block w-1.5 rounded-full bg-ink"
              animate={{ height: i === active ? 32 : 8, opacity: i === active ? 0.9 : 0.2 }}
              transition={{ duration: 0.4, ease }}
            />
          ))}
        </div>
        <motion.div
          aria-hidden
          style={{ scaleX: progress }}
          className="absolute inset-x-0 bottom-0 h-1 origin-left bg-ink/80"
        />
      </motion.div>
    </section>
  );
}

function Slide({ product: p, hideImage }: { product: StoreProduct; hideImage?: boolean }) {
  const name = decodeEntities(p.name);
  const blurb = htmlToText(p.short_description || "").slice(0, 160);
  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 lg:items-start">
      {!hideImage && (
        <div className="relative aspect-square w-full">
          <Image src={p.images[0].src} alt={name} fill sizes="400px" className="object-contain" />
        </div>
      )}
      <h2 className="text-[clamp(2.25rem,1.5rem+3vw,4rem)] leading-[1.05] font-semibold tracking-tight text-balance">
        {name}
      </h2>
      {blurb && <p className="max-w-md text-lead text-pretty text-ink-muted">{blurb}</p>}
      <Price prices={p.prices} onSale={p.on_sale} className="text-title" />
      {/* Slightly smaller on phones so both buttons fit the pinned screen. */}
      <div className="flex max-w-full flex-wrap items-center justify-center gap-3 lg:justify-start">
        <Link href={productHref(p.slug)} className={buttonClasses({ size: "lg", className: compact })}>
          Discover {name}
        </Link>
        <Link href="/shop" className={buttonClasses({ variant: "secondary", size: "lg", className: compact })}>
          Shop
        </Link>
      </div>
    </div>
  );
}
