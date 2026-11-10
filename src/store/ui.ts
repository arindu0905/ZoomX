import { create } from "zustand";

export type Panel = "menu" | "search" | "categories" | "bag" | null;

interface UiState {
  /** Only one overlay/flyout/drawer is open at a time. */
  panel: Panel;
  open: (panel: Exclude<Panel, null>) => void;
  close: () => void;
  toggle: (panel: Exclude<Panel, null>) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  panel: null,
  open: (panel) => set({ panel }),
  close: () => set({ panel: null }),
  toggle: (panel) => set((s) => ({ panel: s.panel === panel ? null : panel })),
}));
