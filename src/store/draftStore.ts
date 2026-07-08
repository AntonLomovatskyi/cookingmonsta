/**
 * Hand-off channel between the Import (AI) flow and the recipe editor. Not persisted — it just
 * carries a freshly-parsed recipe from `Import` into `RecipeNew` so the user can review/tweak
 * before saving.
 */
import { create } from "zustand";
import type { Recipe } from "@/types/recipe";

interface DraftState {
  draft: Recipe | null;
  setDraft: (r: Recipe | null) => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  draft: null,
  setDraft: (r) => set({ draft: r }),
}));
