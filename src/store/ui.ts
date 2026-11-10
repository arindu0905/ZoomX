import { create } from "zustand";

export type Panel = "menu" | "search" | "categories" | null;

interface UiState {
  /** Only one overlay/flyout is open at a time. */
  panel: Panel;
  open: (panel: Exclude<Panel, null>) => void;
  close: () => void;
  toggle: (panel: Exclude<Panel, null>) => void;

  /**
   * Bag badge count. Display-only mirror of the WooCommerce cart's
   * `items_count`; it is set from cart API responses (Phase 7) and is never
   * used to compute anything.
   */
  bagCount: number;
  setBagCount: (count: number) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  panel: null,
  open: (panel) => set({ panel }),
  close: () => set({ panel: null }),
  toggle: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel })),
  bagCount: 0,
  setBagCount: (count) => set({ bagCount: Math.max(0, Math.floor(count)) }),
}));
