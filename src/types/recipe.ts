import { z } from "zod";

/**
 * Single source of truth for the recipe data model.
 *
 * zod schemas are authoritative; the TypeScript types are derived with `z.infer`. This gives us
 * both a typed model (compile time) and runtime validation of stored / AI-extracted recipes.
 *
 * Units are kept as free text ("g", "ml", "tbsp", "clove", "pinch", …) so recipes parsed from any
 * source or language round-trip losslessly. `quantity` is the numeric part used for serving scaling.
 */

export const IngredientSchema = z.object({
  /** Full ingredient name, e.g. "smoked paprika" or "яйце". */
  name: z.string(),
  /** Numeric amount for scaling. Omitted for to-taste / unmeasured items. */
  quantity: z.number().optional(),
  /** Unit as written, e.g. "g", "ml", "tbsp", "clove". */
  unit: z.string().optional(),
  /** Free-text qualifier, e.g. "finely chopped", "to taste", "room temperature". */
  note: z.string().optional(),
});
export type Ingredient = z.infer<typeof IngredientSchema>;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const DifficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const RecipeSourceSchema = z.object({
  /** Where the recipe came from. */
  type: z.enum(["youtube", "manual", "import"]),
  url: z.string().optional(),
  videoId: z.string().optional(),
  /** Creator / channel name. */
  author: z.string().optional(),
});
export type RecipeSource = z.infer<typeof RecipeSourceSchema>;

export const RecipeSchema = z.object({
  /** URL-safe unique slug. */
  id: z.string(),
  /** Display name of the dish. */
  title: z.string(),
  /** Short blurb / summary. */
  description: z.string().optional(),
  /** Base number of servings the amounts are written for. */
  servings: z.number().int().positive().optional(),
  prepMinutes: z.number().int().nonnegative().optional(),
  cookMinutes: z.number().int().nonnegative().optional(),
  cuisine: z.string().optional(),
  difficulty: DifficultySchema.optional(),
  /** Free-form tags (meal, diet, method, mood, …). */
  tags: z.array(z.string()),
  ingredients: z.array(IngredientSchema),
  /** Ordered preparation steps. */
  steps: z.array(z.string()),
  /** Cover image URL (e.g. the YouTube thumbnail). */
  image: z.string().optional(),
  source: RecipeSourceSchema.optional(),
  /** epoch ms this recipe was added. */
  createdAt: z.number().optional(),
});
export type Recipe = z.infer<typeof RecipeSchema>;

/** Total time helper (prep + cook), undefined when neither is known. */
export function totalMinutes(r: Pick<Recipe, "prepMinutes" | "cookMinutes">): number | undefined {
  const p = r.prepMinutes ?? 0;
  const c = r.cookMinutes ?? 0;
  const t = p + c;
  return t > 0 ? t : undefined;
}
