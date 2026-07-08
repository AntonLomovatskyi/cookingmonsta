import { z } from "zod";

/**
 * Single source of truth for the recipe data model.
 *
 * zod schemas are authoritative; the TypeScript types are derived with `z.infer`.
 *
 * Recipes are BILINGUAL: every human-readable field is an `L10n` pair holding English and
 * Ukrainian text. The UI picks one via the user's language setting; extraction generates both.
 *
 * Units policy: metric only — grams / ml / spoons (tbsp, tsp) / counts (pieces, cloves).
 * No cups, oz, lb or sticks; the extractor converts them.
 */

export const L10nSchema = z.object({ en: z.string(), uk: z.string() });
export type L10n = z.infer<typeof L10nSchema>;

export type Lang = "en" | "uk";

/** Pick a language from an L10n pair, falling back to whichever side has content. */
export function pickL(l: L10n, lang: Lang): string;
export function pickL(l: L10n | undefined, lang: Lang): string | undefined;
export function pickL(l: L10n | undefined, lang: Lang): string | undefined {
  if (!l) return undefined;
  return l[lang] || l.en || l.uk || undefined;
}

export const IngredientSchema = z.object({
  /** Ingredient name, e.g. { en: "smoked paprika", uk: "копчена паприка" }. */
  name: L10nSchema,
  /** Numeric amount for scaling. Omitted for to-taste / unmeasured items. */
  quantity: z.number().optional(),
  /** Unit — metric/spoons/count only: g, ml, tbsp, tsp, clove, … (localized). */
  unit: L10nSchema.optional(),
  /** Free-text qualifier, e.g. "finely chopped", "to taste" (localized). */
  note: L10nSchema.optional(),
});
export type Ingredient = z.infer<typeof IngredientSchema>;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const DifficultySchema = z.enum(DIFFICULTIES);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const RecipeSourceSchema = z.object({
  type: z.enum(["youtube", "manual", "import"]),
  url: z.string().optional(),
  videoId: z.string().optional(),
  author: z.string().optional(),
});
export type RecipeSource = z.infer<typeof RecipeSourceSchema>;

export const RecipeSchema = z.object({
  /** URL-safe unique slug (latin). */
  id: z.string(),
  title: L10nSchema,
  description: L10nSchema.optional(),
  /** Base number of servings the amounts are written for. */
  servings: z.number().int().positive().optional(),
  prepMinutes: z.number().int().nonnegative().optional(),
  cookMinutes: z.number().int().nonnegative().optional(),
  cuisine: L10nSchema.optional(),
  difficulty: DifficultySchema.optional(),
  /** Free-form lowercase tags (english slugs, used for filtering). */
  tags: z.array(z.string()),
  ingredients: z.array(IngredientSchema),
  /** Ordered preparation steps, each bilingual. */
  steps: z.array(L10nSchema),
  /** Estimated kcal per serving. */
  caloriesPerServing: z.number().positive().optional(),
  /** Estimated ingredient cost per serving, in ₴ (UAH). */
  priceUah: z.number().positive().optional(),
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
