/**
 * Shopping-list aggregation: merge the ingredients of all selected recipes (scaled to the chosen
 * servings) into one checklist. Pure logic — no React/store imports.
 *
 * Grouping key = normalized english name + unit, so "butter 170 g" from two recipes sums into one
 * line, while "butter 2 tbsp" stays separate (different unit). Items without a quantity (to taste)
 * group by name only and render without an amount.
 */
import type { L10n, Recipe } from "@/types/recipe";

export interface ShoppingSelection {
  recipe: Recipe;
  /** Desired servings (or batch count when the recipe has no base servings). */
  servings: number;
}

export interface ShoppingItem {
  /** Stable key for check-off persistence. */
  key: string;
  name: L10n;
  unit?: L10n;
  /** Summed quantity; undefined for unmeasured (to-taste) items. */
  quantity?: number;
  /** How many selected recipes contributed to this line. */
  fromRecipes: number;
}

/** Servings ratio for a selection: scale by base servings, or treat the value as batches. */
export function selectionRatio(sel: ShoppingSelection): number {
  return sel.recipe.servings ? sel.servings / sel.recipe.servings : sel.servings;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function itemKey(name: L10n, unit: L10n | undefined, measured: boolean): string {
  return `${normalize(name.en)}|${unit ? normalize(unit.en) : measured ? "" : "~"}`;
}

export function buildShoppingList(selections: ShoppingSelection[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  const contributors = new Map<string, Set<string>>(); // key -> recipe ids (a recipe listing an
  // ingredient twice, e.g. "butter, divided", still counts as one contributing recipe)
  for (const sel of selections) {
    const ratio = selectionRatio(sel);
    for (const ing of sel.recipe.ingredients) {
      const measured = ing.quantity != null;
      const key = itemKey(ing.name, measured ? ing.unit : undefined, measured);
      const existing = map.get(key);
      if (existing) {
        if (measured) existing.quantity = (existing.quantity ?? 0) + ing.quantity! * ratio;
      } else {
        map.set(key, {
          key,
          name: ing.name,
          unit: measured ? ing.unit : undefined,
          quantity: measured ? ing.quantity! * ratio : undefined,
          fromRecipes: 1,
        });
      }
      (contributors.get(key) ?? contributors.set(key, new Set()).get(key)!).add(sel.recipe.id);
    }
  }
  for (const item of map.values()) item.fromRecipes = contributors.get(item.key)?.size ?? 1;
  return [...map.values()];
}

/**
 * Estimated total cost in ₴: priceUah is per serving, and the stored value is servings (or
 * batches for base-less recipes, where one "batch serving" is the best estimate available).
 */
export function estimateTotalUah(selections: ShoppingSelection[]): number {
  let total = 0;
  for (const sel of selections) {
    if (sel.recipe.priceUah == null) continue;
    total += sel.recipe.priceUah * sel.servings;
  }
  return Math.round(total);
}
