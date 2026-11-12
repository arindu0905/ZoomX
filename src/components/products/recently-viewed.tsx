"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/layout";
import type { StorePrices } from "@/types/store-api";
import { Price } from "./price";
import { productHref } from "./product-card";

export interface ViewedProduct {
  id: number;
  slug: string;
  name: string;
  image?: string;
  prices: StorePrices;
  onSale: boolean;
}

const KEY = "zx:recently-viewed";
const MAX = 8;

function read(): ViewedProduct[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * Remembers products this visitor opened (this browser only) and shows the
 * others as a small rail. Renders nothing on the first product they view.
 */
export function RecentlyViewed({ current }: { current: ViewedProduct }) {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    const list = read().filter((p) => p.id !== current.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setItems(list);
    try {
      localStorage.setItem(KEY, JSON.stringify([current, ...list].slice(0, MAX)));
    } catch {
      // storage unavailable (private mode) — the rail simply stays hidden
    }
  }, [current]);

  if (!items.length) return null;
  return (
    <section aria-labelledby="recent-heading" className="py-section">
      <Container>
        <h2 id="recent-heading" className="text-title">
          Recently viewed.
        </h2>
        <ul className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
          {items.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="w-40 shrink-0 snap-start"
            >
              <Link href={productHref(p.slug)} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-[10%] bg-canvas-alt">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-contain p-4 transition-transform duration-500 ease-standard group-hover:scale-110"
                    />
                  )}
                </div>
                <p className="mt-2 truncate text-body font-medium">{p.name}</p>
                <Price prices={p.prices} onSale={p.onSale} className="text-caption" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
