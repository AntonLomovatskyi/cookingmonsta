/**
 * Feed categories, derived at runtime from each recipe's tags (no data migration needed).
 * First matching rule wins — order matters: anything without a "dessert" tag is a meal;
 * desserts then fall into the most specific shelf.
 */
import type { Recipe } from "@/types/recipe";

export const CATEGORIES = [
  "all",
  "cookies",
  "bars",
  "rolls",
  "muffins",
  "cheesecake",
  "cakes",
  "meals",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<Category, string> = {
  all: "🍽️",
  cookies: "🍪",
  bars: "🍫",
  rolls: "🥐",
  muffins: "🧁",
  cheesecake: "🧀",
  cakes: "🎂",
  meals: "🍳",
  other: "✨",
};

const BARS = ["brownies", "brownie", "blondies", "bars"];
const ROLLS = ["cinnamon-rolls", "rolls", "buns", "bread", "pretzel", "pastry", "donuts", "churro"];
const MUFFINS = ["muffins", "cupcakes"];
const CAKES = ["cake", "loaf", "tiramisu", "tres-leches"];

export function categorize(recipe: Recipe): Exclude<Category, "all"> {
  const tags = recipe.tags;
  const has = (list: string[]) => list.some((t) => tags.includes(t));
  if (!tags.includes("dessert")) return "meals";
  if (tags.includes("cookies")) return "cookies";
  if (has(BARS)) return "bars";
  if (has(ROLLS)) return "rolls";
  if (has(MUFFINS)) return "muffins";
  if (tags.includes("cheesecake")) return "cheesecake";
  if (has(CAKES)) return "cakes";
  return "other";
}
