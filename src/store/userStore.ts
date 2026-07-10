/**
 * On-device user state (favourites, cook log, notes, own recipes, prefs, API keys).
 * Persisted via zustand + localStorage.
 *
 * The synced subset is `PersistedData` (see below). API keys are deliberately EXCLUDED from it, so
 * they never leave this browser — they are not pushed to Firestore and not written to backups.
 *
 * v2 migration: recipes became bilingual (plain strings → {en, uk} pairs).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getSeedRecipeById } from "@/data/recipes";
import type { L10n, Lang, Recipe } from "@/types/recipe";

export interface CookEntry {
  recipeId: string;
  at: number; // epoch ms
}

export interface UserState {
  favourites: string[]; // recipe ids
  notes: Record<string, string>; // id -> personal note (single language, personal)
  cooked: CookEntry[]; // cook log, most-recent first
  recentlyViewed: string[]; // recipe ids, most-recent first (local only)
  /** Shopping list: recipeId -> desired servings (or batch count when the recipe has no base). */
  shopping: Record<string, number>;
  /** Aggregated shopping lines ticked off as bought (keys from domain/shopping). */
  boughtItems: string[];
  /** Weekly meal plan: local date key (YYYY-MM-DD) -> recipe ids (duplicates allowed). */
  plan: Record<string, string[]>;
  /** User-created & imported recipes, merged into the catalog at runtime. */
  userRecipes: Recipe[];
  theme: "dark" | "light";
  language: Lang;
  /** Anthropic API key — stored locally; cloud-synced via getCloudSnapshot(). */
  anthropicKey: string;

  setTheme: (t: "dark" | "light") => void;
  setLanguage: (l: Lang) => void;
  setAnthropicKey: (k: string) => void;
  toggleFavourite: (id: string) => void;
  setNote: (id: string, text: string) => void;
  logCooked: (id: string) => void;
  clearCooked: () => void;
  setShoppingServings: (id: string, servings: number) => void;
  clearShopping: () => void;
  toggleBought: (key: string) => void;
  clearBought: () => void;
  /** Drop ticked keys that no longer exist on the aggregated list (prevents stale pre-checks). */
  pruneBought: (validKeys: string[]) => void;
  addToPlan: (date: string, id: string) => void;
  removeFromPlan: (date: string, index: number) => void;
  pushRecentlyViewed: (id: string) => void;
  addUserRecipe: (r: Recipe) => void;
  removeUserRecipe: (id: string) => void;
  clearFavourites: () => void;
  importData: (d: Partial<PersistedData>) => void;
}

/**
 * The user-data fields that are exported/imported and cloud-synced. `anthropicKey` is optional:
 * cloud sync includes it (so signing in brings your key to a new device); backup files omit it.
 * YouTube fetching uses the app-wide VITE_YOUTUBE_API_KEY — no per-user key.
 */
export type PersistedData = Pick<
  UserState,
  | "favourites"
  | "notes"
  | "cooked"
  | "shopping"
  | "boughtItems"
  | "plan"
  | "userRecipes"
  | "recentlyViewed"
  | "theme"
  | "language"
> & { anthropicKey?: string };

/* ---------- v1 → v2 migration: plain strings → bilingual L10n pairs ---------- */

function toL(v: unknown): L10n | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v.trim() ? { en: v, uk: v } : undefined;
  const o = v as { en?: unknown; uk?: unknown };
  if (typeof o.en === "string" || typeof o.uk === "string") {
    const e = typeof o.en === "string" ? o.en : "";
    const u = typeof o.uk === "string" ? o.uk : "";
    return e || u ? { en: e || u, uk: u || e } : undefined;
  }
  return undefined;
}

function migrateRecipeV2(r: unknown): Recipe {
  const o = r as Record<string, unknown>;
  const ings = Array.isArray(o.ingredients) ? o.ingredients : [];
  const steps = Array.isArray(o.steps) ? o.steps : [];
  return {
    ...(o as object),
    title: toL(o.title) ?? { en: "Untitled", uk: "Без назви" },
    description: toL(o.description),
    cuisine: toL(o.cuisine),
    ingredients: ings.map((i) => {
      const io = i as Record<string, unknown>;
      return {
        name: toL(io.name) ?? { en: "?", uk: "?" },
        quantity: typeof io.quantity === "number" ? io.quantity : undefined,
        unit: toL(io.unit),
        note: toL(io.note),
      };
    }),
    steps: steps.map((s) => toL(s)).filter((s): s is L10n => !!s),
  } as Recipe;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      favourites: [],
      notes: {},
      cooked: [],
      recentlyViewed: [],
      shopping: {},
      boughtItems: [],
      plan: {},
      userRecipes: [],
      theme: "dark",
      language: "en",
      anthropicKey: "",

      setTheme: (t) => set({ theme: t }),
      setLanguage: (l) => set({ language: l }),
      setAnthropicKey: (k) => set({ anthropicKey: k.trim() }),
      toggleFavourite: (id) =>
        set((s) => ({
          favourites: s.favourites.includes(id) ? s.favourites.filter((x) => x !== id) : [...s.favourites, id],
        })),
      setNote: (id, text) =>
        set((s) => {
          const notes = { ...s.notes };
          if (text.trim()) notes[id] = text;
          else delete notes[id];
          return { notes };
        }),
      logCooked: (id) => set((s) => ({ cooked: [{ recipeId: id, at: Date.now() }, ...s.cooked].slice(0, 500) })),
      clearCooked: () => set({ cooked: [] }),
      setShoppingServings: (id, servings) =>
        set((s) => {
          const next = { ...s.shopping };
          if (servings <= 0) delete next[id];
          else next[id] = servings;
          return { shopping: next };
        }),
      clearShopping: () => set({ shopping: {}, boughtItems: [] }),
      toggleBought: (key) =>
        set((s) => ({
          boughtItems: s.boughtItems.includes(key) ? s.boughtItems.filter((x) => x !== key) : [...s.boughtItems, key],
        })),
      clearBought: () => set({ boughtItems: [] }),
      pruneBought: (validKeys) =>
        set((s) => {
          const pruned = s.boughtItems.filter((k) => validKeys.includes(k));
          return pruned.length === s.boughtItems.length ? s : { boughtItems: pruned };
        }),
      addToPlan: (date, id) => set((s) => ({ plan: { ...s.plan, [date]: [...(s.plan[date] ?? []), id] } })),
      removeFromPlan: (date, index) =>
        set((s) => {
          const day = (s.plan[date] ?? []).filter((_, i) => i !== index);
          const plan = { ...s.plan };
          if (day.length) plan[date] = day;
          else delete plan[date];
          return { plan };
        }),
      pushRecentlyViewed: (id) =>
        set((s) => ({ recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 12) })),
      addUserRecipe: (r) => set((s) => ({ userRecipes: [r, ...s.userRecipes.filter((x) => x.id !== r.id)] })),
      removeUserRecipe: (id) =>
        set((s) => {
          // If the deleted copy merely shadowed a bundled recipe (edit flow reuses the seed id),
          // the recipe stays in the catalog — keep its plan/shopping/favourite entries.
          if (getSeedRecipeById(id)) {
            return { userRecipes: s.userRecipes.filter((x) => x.id !== id) };
          }
          const shopping = { ...s.shopping };
          delete shopping[id];
          const plan = Object.fromEntries(
            Object.entries(s.plan)
              .map(([d, ids]) => [d, ids.filter((x) => x !== id)] as const)
              .filter(([, ids]) => ids.length),
          );
          return {
            userRecipes: s.userRecipes.filter((x) => x.id !== id),
            favourites: s.favourites.filter((x) => x !== id),
            shopping,
            plan,
          };
        }),
      clearFavourites: () => set({ favourites: [] }),
      importData: (d) =>
        set((s) => ({
          favourites: d.favourites ?? s.favourites,
          notes: d.notes ?? s.notes,
          cooked: d.cooked ?? s.cooked,
          shopping: d.shopping ?? s.shopping,
          boughtItems: d.boughtItems ?? s.boughtItems,
          plan: d.plan ?? s.plan,
          // Backups may predate the bilingual schema — normalise on the way in.
          userRecipes: d.userRecipes ? d.userRecipes.map(migrateRecipeV2) : s.userRecipes,
          recentlyViewed: d.recentlyViewed ?? s.recentlyViewed,
          theme: d.theme ?? s.theme,
          language: d.language ?? s.language,
          anthropicKey: d.anthropicKey || s.anthropicKey,
        })),
    }),
    {
      name: "cookingmonsta/v1/user",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        const s = persisted as Partial<UserState> & { youtubeKey?: string; aiModel?: string };
        if (version < 2 && Array.isArray(s.userRecipes)) {
          s.userRecipes = s.userRecipes.map(migrateRecipeV2);
        }
        if (version < 3) delete s.youtubeKey; // per-user YouTube key removed; app-wide key only
        if (version < 4) delete s.aiModel; // model selector removed; extraction always uses Haiku
        return s as UserState;
      },
    },
  ),
);
