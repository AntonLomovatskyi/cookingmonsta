/**
 * Data-access seam for recipes. TODAY: bundled seed recipes (offline). The one file that knows
 * where the built-in recipes come from — swap the internals here for an HTTP client later and the
 * screens that import from `@/data/recipes` never change.
 */
import type { Recipe } from "@/types/recipe";
import { SEED_RECIPES } from "./seed";

export function getSeedRecipes(): Recipe[] {
  return SEED_RECIPES;
}

export function getSeedRecipeById(id: string): Recipe | undefined {
  return SEED_RECIPES.find((r) => r.id === id);
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
