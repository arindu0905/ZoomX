"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";

export interface LineupItem {
  id: number;
  name: string;
  href: string;
  src: string;
}

/**
 * The hero's product line-up. Bottles rise in, drift with the pointer
 * (nearer bottles move more) and fan apart as the page scrolls. Each one is
 * a link: hovering lifts it and shows its name.
 */
export function HeroLineup({ items }: { items: LineupItem[] }) {
  const reduce = useReducedMotion();
  const pointer = useSpring(useMotionValue(0), { stiffness: 60, damping: 18, mass: 0.6 });
  const { scrollY } = useScroll();
  const mid = (items.length - 1) / 2;

  return (
    <ul
      aria-label="The ZOOM X range"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        pointer.set(((e.clientX - r.left) / r.width - 0.5) * 2);
      }}
      onPointerLeave={() => pointer.set(0)}
      className="mx-auto flex max-w-6xl items-end justify-center [--overlap:-3.5rem] sm:[--overlap:-6rem]"
    >
      {items.map((item, i) => (
        <Bottle key={item.id} item={item} offset={i - mid} pointer={pointer} scrollY={scrollY} still={!!reduce} />
      ))}
    </ul>
  );
}

function Bottle({
  item,
  offset,
  pointer,
  scrollY,
  still,
}: {
  item: LineupItem;
  /** Position relative to the centre bottle: -3 … 3. */
  offset: number;
  pointer: MotionValue<number>;
  scrollY: MotionValue<number>;
  still: boolean;
}) {
  const lift = Math.abs(offset);
  const depth = 1 - lift * 0.22; // centre bottles are "nearer"
  const fan = useTransform(scrollY, [0, 700], [0, offset * 34]);
  const sink = useTransform(scrollY, [0, 700], [0, lift * 18 - 30]);
  const x = useTransform([pointer, fan], ([p, f]: number[]) => f - p * 26 * depth);

  return (
    <motion.li
      style={
        {
          zIndex: 10 - Math.round(lift),
          marginInline: "calc(var(--overlap) / 2)",
          "--i": 3 + lift * 2,
          ...(still ? {} : { x, y: sink }),
        } as unknown as React.ComponentProps<typeof motion.li>["style"]
      }
      // Phones show the three centre bottles, larger; wider screens show the full line-up.
      className={(lift > 1 ? "max-sm:hidden " : "") + "group/bottle relative hover:!z-20 focus-within:!z-20"}
    >
      <Link href={item.href} className="block animate-rise rounded-2xl focus-visible:outline-offset-4">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 left-1/2 z-10 flex -translate-x-1/2 translate-y-2 items-center gap-1 rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition duration-300 ease-emphasized group-hover/bottle:translate-y-0 group-hover/bottle:opacity-100 group-focus-within/bottle:translate-y-0 group-focus-within/bottle:opacity-100 max-sm:hidden"
        >
          {item.name}
          <ArrowUpRight className="size-3.5" />
        </span>
        <span className="bob block">
          <Image
            src={item.src}
            alt={item.name}
            width={450}
            height={500}
            priority={lift < 1}
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 34vw, 42vw"
            style={{ transform: `scale(${1 - lift * 0.07})`, transformOrigin: "bottom center" }}
            className="h-auto w-[42vw] max-w-[300px] sm:w-[34vw] drop-shadow-[0_24px_24px_rgba(0,0,0,0.14)] transition-[translate] duration-500 ease-emphasized group-hover/bottle:-translate-y-4"
          />
        </span>
      </Link>
    </motion.li>
  );
}
