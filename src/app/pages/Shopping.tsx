import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useAllRecipes } from "@/data/useRecipes";
import { buildShoppingList, estimateTotalUah, type ShoppingSelection } from "@/domain/shopping";
import { servingsWord, useLang, useT } from "@/i18n";
import { formatQuantity } from "@/lib/scale";
import { pickL } from "@/types/recipe";
import { useUserStore } from "@/store/userStore";

export default function Shopping() {
  const t = useT();
  const lang = useLang();
  const all = useAllRecipes();
  const shopping = useUserStore((s) => s.shopping);
  const setShoppingServings = useUserStore((s) => s.setShoppingServings);
  const clearShopping = useUserStore((s) => s.clearShopping);
  const boughtItems = useUserStore((s) => s.boughtItems);
  const toggleBought = useUserStore((s) => s.toggleBought);
  const clearBought = useUserStore((s) => s.clearBought);
  const pruneBought = useUserStore((s) => s.pruneBought);

  const selections = useMemo<ShoppingSelection[]>(
    () =>
      Object.entries(shopping)
        .map(([id, servings]) => {
          const recipe = all.find((r) => r.id === id);
          return recipe ? { recipe, servings } : undefined;
        })
        .filter((s): s is ShoppingSelection => !!s),
    [shopping, all],
  );

  const items = useMemo(() => {
    const list = buildShoppingList(selections);
    return list.sort((a, b) => pickL(a.name, lang).localeCompare(pickL(b.name, lang), lang));
  }, [selections, lang]);

  const total = useMemo(() => estimateTotalUah(selections), [selections]);
  const boughtCount = items.filter((i) => boughtItems.includes(i.key)).length;

  // Ticks belong to the current list only — drop keys whose lines are gone, so a recipe re-added
  // next week doesn't show up pre-checked.
  useEffect(() => {
    const valid = items.map((i) => i.key);
    if (boughtItems.some((k) => !valid.includes(k))) pruneBought(valid);
  }, [items, boughtItems, pruneBought]);

  if (selections.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-text-dim">
        <div className="text-4xl">🛒</div>
        <div className="mt-3">{t.shopping.empty}</div>
        <div className="mt-1 text-sm text-text-faint">{t.shopping.emptyHint}</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-text">
        <ShoppingCart size={22} className="text-flame" /> {t.shopping.title}
      </h1>

      {/* Selected recipes with servings steppers */}
      <div className="mt-4">
        <div className="text-sm font-bold text-flame">{t.shopping.recipesOn}</div>
        <div className="mt-2 space-y-2">
          {selections.map(({ recipe, servings }) => (
            <div key={recipe.id} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
              <Link to={`/recipe/${recipe.id}`} className="min-w-0 flex-1 truncate text-sm text-text">
                {pickL(recipe.title, lang)}
              </Link>
              <div className="flex items-center gap-1.5 rounded-full border border-border px-1.5 py-0.5">
                <button
                  onClick={() => setShoppingServings(recipe.id, servings - 1)}
                  className="p-1 text-text-dim hover:text-flame"
                  aria-label="Fewer"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-10 text-center text-xs text-text">
                  {servings} {recipe.servings != null ? servingsWord(servings, lang) : "×"}
                </span>
                <button
                  onClick={() => setShoppingServings(recipe.id, servings + 1)}
                  className="p-1 text-text-dim hover:text-flame"
                  aria-label="More"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => setShoppingServings(recipe.id, 0)}
                className="p-1.5 text-text-faint hover:text-danger"
                aria-label="Remove"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated total */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-herb/50 bg-herb/10 px-4 py-3">
          <span className="text-sm text-text">{t.shopping.estTotal}</span>
          <span className="font-display text-lg font-bold text-herb">≈ ₴{total}</span>
        </div>
      )}

      {/* Aggregated checklist */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-flame">{t.detail.ingredients}</div>
          <span className="text-xs text-text-faint">
            {boughtCount}/{items.length}
          </span>
        </div>
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => {
            const bought = boughtItems.includes(item.key);
            return (
              <li key={item.key}>
                <button
                  onClick={() => toggleBought(item.key)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition",
                    bought ? "border-border bg-surface-alt text-text-faint" : "border-border bg-surface text-text",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs",
                      bought ? "border-herb bg-herb text-bg" : "border-border",
                    )}
                  >
                    {bought ? "✓" : ""}
                  </span>
                  <span className={clsx("min-w-0 flex-1", bought && "line-through")}>
                    {item.quantity != null ? (
                      <span className="font-semibold">
                        {formatQuantity(item.quantity)}
                        {item.unit ? ` ${pickL(item.unit, lang)}` : ""}{" "}
                      </span>
                    ) : null}
                    {pickL(item.name, lang)}
                    {item.quantity == null && <span className="text-text-faint"> — {t.shopping.toTaste}</span>}
                  </span>
                  {item.fromRecipes > 1 && <span className="text-[10px] text-text-faint">×{item.fromRecipes}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={clearBought}
          className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-sm text-text"
        >
          {t.shopping.clearBought}
        </button>
        <button
          onClick={() => window.confirm(t.shopping.clearAllConfirm) && clearShopping()}
          className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-sm text-danger"
        >
          {t.shopping.clearAll}
        </button>
      </div>
    </div>
  );
}
