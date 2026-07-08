import type { Recipe } from "@/types/recipe";

/**
 * Recipes imported via the `/import-recipe` Claude Code skill (see .claude/skills/import-recipe).
 * These are committed to the repo and bundled into the deploy, so they appear on every device
 * without needing an API key or Firebase sync. Newest first.
 *
 * The in-app YouTube import (Settings → Anthropic API key) still exists for on-the-go imports;
 * those land in localStorage/Firestore instead of here.
 */
export const IMPORTED_RECIPES: Recipe[] = [
  {
    id: "chewy-chocolate-chip-cookies",
    title: "Chewy Chocolate Chip Cookies",
    description:
      "Eggless, chewy chocolate chip cookies with rippled edges. Makes 12 regular (2 tbsp) or 6 large (4 tbsp) cookies.",
    servings: 12,
    prepMinutes: 45,
    cookMinutes: 12,
    cuisine: "American",
    difficulty: "easy",
    tags: ["dessert", "baking", "cookies", "eggless", "sweet"],
    ingredients: [
      { name: "butter", quantity: 170, unit: "g", note: "melted; salted or unsalted (¾ cup)" },
      { name: "light brown sugar", quantity: 150, unit: "g", note: "¾ cup" },
      { name: "granulated sugar", quantity: 65, unit: "g", note: "⅓ cup" },
      { name: "vanilla extract", quantity: 1.5, unit: "tsp" },
      { name: "milk", quantity: 60, unit: "ml", note: "any milk will work (¼ cup)" },
      { name: "all-purpose flour", quantity: 218, unit: "g", note: "1¾ cup + 1 tbsp" },
      { name: "baking soda", quantity: 0.75, unit: "tsp" },
      { name: "salt", quantity: 0.75, unit: "tsp" },
      { name: "cinnamon", quantity: 0.5, unit: "tsp" },
      { name: "cornstarch", quantity: 2, unit: "tsp" },
      {
        name: "chocolate",
        quantity: 270,
        unit: "g",
        note: "1½ cups — e.g. 1 cup chocolate chips + ½ cup chopped semi-sweet bar",
      },
    ],
    steps: [
      "Whisk the melted butter, light brown sugar and granulated sugar together until combined.",
      "Mix in the vanilla extract and milk.",
      "Add the flour, baking soda, salt, cinnamon and cornstarch and mix until a soft dough forms — don't overmix.",
      "Fold in the chocolate.",
      "Scoop into 12 regular (2 tbsp) or 6 large (4 tbsp) dough balls on a lined tray.",
      "Freeze the dough balls, uncovered, for 30 minutes.",
      "Bake at 177°C (350°F): 10–12 minutes for regular cookies, 12–14 minutes for large. They spread — bake at most 6 regular (or 4 large) per tray.",
      "For rippled edges, lightly bang the pan on the counter a couple of times straight out of the oven. Let cool before eating.",
    ],
    image: "https://i.ytimg.com/vi/1gcLatHJa8o/hqdefault.jpg",
    source: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=1gcLatHJa8o",
      videoId: "1gcLatHJa8o",
      author: "a little calm",
    },
    createdAt: 1783429200000,
  },
];
