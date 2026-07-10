/** Transient browse state (search query, category, smart filters, sort). Not persisted. */
import { create } from "zustand";
import type { Category } from "@/domain/categories";

export type SortMode = "recent" | "title" | "time" | "cooked";

interface FilterState {
  query: string;
  category: Category;
  /** Smart filters: total time ≤ 30 min / price ≤ ₴25 / ≤ 300 kcal per serving. */
  quick: boolean;
  cheap: boolean;
  light: boolean;
  sort: SortMode;
  setQuery: (q: string) => void;
  setCategory: (c: Category) => void;
  toggleQuick: () => void;
  toggleCheap: () => void;
  toggleLight: () => void;
  setSort: (s: SortMode) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  query: "",
  category: "all",
  quick: false,
  cheap: false,
  light: false,
  sort: "recent",
  setQuery: (q) => set({ query: q }),
  setCategory: (c) => set({ category: c }),
  toggleQuick: () => set((s) => ({ quick: !s.quick })),
  toggleCheap: () => set((s) => ({ cheap: !s.cheap })),
  toggleLight: () => set((s) => ({ light: !s.light })),
  setSort: (s) => set({ sort: s }),
}));
