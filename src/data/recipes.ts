/**
 * Data-access seam for recipes. TODAY: bundled seed recipes (offline). The one file that knows
 * where the built-in recipes come from — swap the internals here for an HTTP client later and the
 * screens that import from `@/data/recipes` never change.
 */
import type { Recipe } from "@/types/recipe";
import { IMPORTED_RECIPES } from "./imported";
import { SEED_RECIPES } from "./seed";

/** Bundled catalog = repo-committed imports (via /import-recipe) + starter seeds. */
const BUNDLED: Recipe[] = [...IMPORTED_RECIPES, ...SEED_RECIPES];

export function getSeedRecipes(): Recipe[] {
  return BUNDLED;
}

export function getSeedRecipeById(id: string): Recipe | undefined {
  return BUNDLED.find((r) => r.id === id);
}

/** URL-safe slug from a title, with a fallback so ids are always unique-ish. */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || `recipe-${Date.now().toString(36)}`;
}
