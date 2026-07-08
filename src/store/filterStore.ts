/** Transient browse state (search query, tag filters, sort). Not persisted. */
import { create } from "zustand";

export type SortMode = "recent" | "title" | "time" | "cooked";

interface FilterState {
  query: string;
  tags: string[];
  sort: SortMode;
  setQuery: (q: string) => void;
  toggleTag: (t: string) => void;
  clearTags: () => void;
  setSort: (s: SortMode) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  query: "",
  tags: [],
  sort: "recent",
  setQuery: (q) => set({ query: q }),
  toggleTag: (t) => set((s) => ({ tags: s.tags.includes(t) ? s.tags.filter((x) => x !== t) : [...s.tags, t] })),
  clearTags: () => set({ tags: [] }),
  setSort: (s) => set({ sort: s }),
}));
