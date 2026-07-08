import type { Ingredient } from "@/types/recipe";

/** Format a possibly-fractional quantity nicely (½, 1¼, 2, 1.5 → keeps common fractions readable). */
export function formatQuantity(q: number): string {
  const rounded = Math.round(q * 100) / 100;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  const fractions: [number, string][] = [
    [0.25, "¼"],
    [0.33, "⅓"],
    [0.5, "½"],
    [0.66, "⅔"],
    [0.75, "¾"],
  ];
  for (const [value, glyph] of fractions) {
    if (Math.abs(frac - value) < 0.04) return whole > 0 ? `${whole}${glyph}` : glyph;
  }
  return rounded % 1 === 0 ? String(rounded) : String(rounded);
}

/** Scale an ingredient's numeric quantity by a servings ratio. Non-numeric items pass through. */
export function scaleIngredient(ing: Ingredient, ratio: number): Ingredient {
  if (ing.quantity == null || ratio === 1) return ing;
  return { ...ing, quantity: ing.quantity * ratio };
}
