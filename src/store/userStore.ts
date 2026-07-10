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
import type { L10n, Lang, Recipe } from "@/types/recipe";

/** Extraction models the user can choose from (Settings). Ordered cheap → powerful. */
export const AI_MODELS = [
  { id: "claude-haiku-4-5", label: "Haiku 4.5", hint: "fast & cheap · default" },
  { id: "claude-sonnet-5", label: "Sonnet 5", hint: "balanced" },
  { id: "claude-opus-4-8", label: "Opus 4.8", hint: "most capable" },
  { id: "claude-fable-5", label: "Fable 5", hint: "🔥 heavy" },
] as const;
export type AiModel = (typeof AI_MODELS)[number]["id"];

export interface CookEntry {
  recipeId: string;
  at: number; // epoch ms
}

export interface UserState {
  favourites: string[]; // recipe ids
  notes: Record<string, string>; // id -> personal note (single language, personal)
  cooked: CookEntry[]; // cook log, most-recent first
  recentlyViewed: string[]; // recipe ids, most-recent first (local only)
  /** User-created & imported recipes, merged into the catalog at runtime. */
  userRecipes: Recipe[];
  theme: "dark" | "light";
  language: Lang;
  /** Which Claude model extracts recipes. */
  aiModel: AiModel;
  /** Anthropic API key — stored locally; cloud-synced via getCloudSnapshot(). */
  anthropicKey: string;

  setTheme: (t: "dark" | "light") => void;
  setLanguage: (l: Lang) => void;
  setAiModel: (m: AiModel) => void;
  setAnthropicKey: (k: string) => void;
  toggleFavourite: (id: string) => void;
  setNote: (id: string, text: string) => void;
  logCooked: (id: string) => void;
  clearCooked: () => void;
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
  "favourites" | "notes" | "cooked" | "userRecipes" | "recentlyViewed" | "theme" | "language" | "aiModel"
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
      userRecipes: [],
      theme: "dark",
      language: "en",
      aiModel: "claude-haiku-4-5",
      anthropicKey: "",

      setTheme: (t) => set({ theme: t }),
      setLanguage: (l) => set({ language: l }),
      setAiModel: (m) => set({ aiModel: m }),
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
      pushRecentlyViewed: (id) =>
        set((s) => ({ recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 12) })),
      addUserRecipe: (r) => set((s) => ({ userRecipes: [r, ...s.userRecipes.filter((x) => x.id !== r.id)] })),
      removeUserRecipe: (id) =>
        set((s) => ({
          userRecipes: s.userRecipes.filter((x) => x.id !== id),
          favourites: s.favourites.filter((x) => x !== id),
        })),
      clearFavourites: () => set({ favourites: [] }),
      importData: (d) =>
        set((s) => ({
          favourites: d.favourites ?? s.favourites,
          notes: d.notes ?? s.notes,
          cooked: d.cooked ?? s.cooked,
          // Backups may predate the bilingual schema — normalise on the way in.
          userRecipes: d.userRecipes ? d.userRecipes.map(migrateRecipeV2) : s.userRecipes,
          recentlyViewed: d.recentlyViewed ?? s.recentlyViewed,
          theme: d.theme ?? s.theme,
          language: d.language ?? s.language,
          aiModel: d.aiModel ?? s.aiModel,
          anthropicKey: d.anthropicKey || s.anthropicKey,
        })),
    }),
    {
      name: "cookingmonsta/v1/user",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        const s = persisted as Partial<UserState> & { youtubeKey?: string };
        if (version < 2 && Array.isArray(s.userRecipes)) {
          s.userRecipes = s.userRecipes.map(migrateRecipeV2);
        }
        if (version < 3) delete s.youtubeKey; // per-user YouTube key removed; app-wide key only
        return s as UserState;
      },
    },
  ),
);
