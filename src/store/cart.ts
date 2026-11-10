"use client";

import { create } from "zustand";
import type { ApiErrorBody } from "@/lib/api-route";
import type { Cart } from "@/types/cart";

/**
 * Client mirror of the WooCommerce cart. The cart itself lives in
 * WooCommerce (session via the HttpOnly cookie); this store only holds the
 * latest response from our /api/cart endpoints so the UI can render it.
 * Nothing here computes prices, totals or stock.
 */

export type CartResult = { ok: true } | { ok: false; message: string };

interface CartState {
  cart: Cart | null;
  status: "idle" | "loading" | "ready" | "error";
  /** True while a mutation is in flight (disables controls). */
  pending: boolean;
  load: () => Promise<void>;
  add: (input: {
    id: number;
    quantity: number;
    variation?: { attribute: string; value: string }[];
  }) => Promise<CartResult>;
  update: (key: string, quantity: number) => Promise<CartResult>;
  remove: (key: string) => Promise<CartResult>;
  applyCoupon: (code: string) => Promise<CartResult>;
  removeCoupon: (code: string) => Promise<CartResult>;
  selectRate: (packageId: number | string, rateId: string) => Promise<CartResult>;
  /** After checkout WooCommerce empties the cart; re-sync. */
  reset: () => void;
}

const GENERIC = "Something went wrong. Please try again.";

async function call(url: string, init?: RequestInit): Promise<{ cart?: Cart; message?: string }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      credentials: "same-origin",
    });
    const json = (await res.json().catch(() => null)) as ({ cart?: Cart } & Partial<ApiErrorBody>) | null;
    if (!res.ok) return { message: json?.error?.message ?? GENERIC };
    return { cart: json?.cart };
  } catch {
    return { message: "You appear to be offline. Please check your connection." };
  }
}

export const useCartStore = create<CartState>()((set, get) => {
  const mutate = async (url: string, init: RequestInit): Promise<CartResult> => {
    set({ pending: true });
    const { cart, message } = await call(url, init);
    set((s) => ({ pending: false, cart: cart ?? s.cart, status: cart ? "ready" : s.status }));
    return message ? { ok: false, message } : { ok: true };
  };
  const json = (method: string, body?: unknown): RequestInit => ({
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return {
    cart: null,
    status: "idle",
    pending: false,
    load: async () => {
      if (get().status === "loading") return;
      set({ status: "loading" });
      const { cart } = await call("/api/cart", { cache: "no-store" });
      set({ cart: cart ?? null, status: cart ? "ready" : "error" });
    },
    add: (input) => mutate("/api/cart/items", json("POST", input)),
    update: (key, quantity) => mutate(`/api/cart/items/${key}`, json("PATCH", { quantity })),
    remove: (key) => mutate(`/api/cart/items/${key}`, json("DELETE")),
    applyCoupon: (code) => mutate("/api/cart/coupons", json("POST", { code })),
    removeCoupon: (code) => mutate(`/api/cart/coupons/${encodeURIComponent(code)}`, json("DELETE")),
    selectRate: (packageId, rateId) => mutate("/api/cart/shipping", json("POST", { packageId, rateId })),
    reset: () => set({ cart: null, status: "idle" }),
  };
});
