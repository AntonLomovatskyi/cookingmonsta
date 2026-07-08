import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRecipeById } from "@/data/useRecipes";
import { slugify } from "@/data/recipes";
import { useLang, useT } from "@/i18n";
import { useDraftStore } from "@/store/draftStore";
import { useUserStore } from "@/store/userStore";
import {
  DIFFICULTIES,
  pickL,
  type Difficulty,
  type Ingredient,
  type L10n,
  type Recipe,
  type RecipeSource,
} from "@/types/recipe";

/**
 * The editor works in the ACTIVE app language. The other language side is preserved when a field
 * is left as-is; brand-new text is copied into both sides (switch language in Settings to refine
 * the translation). Imported drafts arrive already bilingual from the extractor.
 */

interface IngredientRow {
  name: string;
  quantity: string;
  unit: string;
  note: string;
  // original bilingual values, kept so the other language survives edits
  _name?: L10n;
  _unit?: L10n;
  _note?: L10n;
}

export default function RecipeNew() {
  const t = useT();
  const lang = useLang();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit") ?? undefined;
  const fromImport = params.get("from") === "import";

  const existing = useRecipeById(editId);
  const draft = useDraftStore((s) => s.draft);
  const setDraft = useDraftStore((s) => s.setDraft);
  const addUserRecipe = useUserStore((s) => s.addUserRecipe);
  const removeUserRecipe = useUserStore((s) => s.removeUserRecipe);

  // Pick the source of initial values once.
  const initial = useMemo<Recipe | undefined>(() => {
    if (fromImport && draft) return draft;
    return existing;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, fromImport]);

  const toRow = (i: Ingredient): IngredientRow => ({
    name: pickL(i.name, lang),
    quantity: i.quantity != null ? String(i.quantity) : "",
    unit: pickL(i.unit, lang) ?? "",
    note: pickL(i.note, lang) ?? "",
    _name: i.name,
    _unit: i.unit,
    _note: i.note,
  });
  const blankRow = (): IngredientRow => ({ name: "", quantity: "", unit: "", note: "" });

  const [title, setTitle] = useState(initial ? pickL(initial.title, lang) : "");
  const [description, setDescription] = useState(initial?.description ? pickL(initial.description, lang) : "");
  const [servings, setServings] = useState(initial?.servings != null ? String(initial.servings) : "");
  const [prep, setPrep] = useState(initial?.prepMinutes != null ? String(initial.prepMinutes) : "");
  const [cook, setCook] = useState(initial?.cookMinutes != null ? String(initial.cookMinutes) : "");
  const [kcal, setKcal] = useState(initial?.caloriesPerServing != null ? String(initial.caloriesPerServing) : "");
  const [price, setPrice] = useState(initial?.priceUah != null ? String(initial.priceUah) : "");
  const [cuisine, setCuisine] = useState(initial?.cuisine ? pickL(initial.cuisine, lang) : "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(initial?.difficulty ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [steps, setSteps] = useState((initial?.steps ?? []).map((s) => pickL(s, lang)).join("\n"));
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initial?.ingredients.length ? initial.ingredients.map(toRow) : [blankRow()],
  );
  const [error, setError] = useState(false);

  const keptImage = initial?.image;
  const keptSource: RecipeSource | undefined = initial?.source;
  const keptId = initial?.id;
  const keptCreatedAt = initial?.createdAt;
  const keptSteps = initial?.steps ?? [];
  const keptTitle = initial?.title;
  const keptDescription = initial?.description;
  const keptCuisine = initial?.cuisine;

  // Clear the import draft once consumed so a back-nav doesn't resurrect it.
  useEffect(() => {
    if (fromImport && draft) setDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRow = (idx: number, patch: Partial<IngredientRow>) =>
    setIngredients((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRow = (idx: number) =>
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  const addRow = () => setIngredients((prev) => [...prev, blankRow()]);

  /** Merge an edited single-language value back into a bilingual pair. */
  const mkL = (value: string, prev?: L10n): L10n | undefined => {
    const v = value.trim();
    if (!v) return undefined;
    if (prev && pickL(prev, lang) === v) return prev; // unchanged — keep both sides
    if (prev) return { ...prev, [lang]: v }; // edited — update this side only
    return { en: v, uk: v }; // new — copy to both sides
  };

  const save = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(true);
      return;
    }
    const built: Ingredient[] = ingredients
      .filter((r) => r.name.trim())
      .map((r) => {
        const out: Ingredient = { name: mkL(r.name, r._name)! };
        const q = r.quantity.trim() ? Number(r.quantity) : undefined;
        if (q != null && !Number.isNaN(q)) out.quantity = q;
        const unit = mkL(r.unit, r._unit);
        if (unit) out.unit = unit;
        const note = mkL(r.note, r._note);
        if (note) out.note = note;
        return out;
      });

    const num = (v: string) => {
      const n = Number(v);
      return v.trim() && !Number.isNaN(n) && n > 0 ? Math.round(n) : undefined;
    };

    const stepLines = steps
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    // Preserve the other language per step index when line counts still match.
    const builtSteps: L10n[] = stepLines.map((line, i) => mkL(line, keptSteps[i])!);

    const id = keptId ?? slugify(trimmedTitle);
    const recipe: Recipe = {
      id,
      title: mkL(trimmedTitle, keptTitle)!,
      description: mkL(description, keptDescription),
      servings: num(servings),
      prepMinutes: num(prep),
      cookMinutes: num(cook),
      caloriesPerServing: num(kcal),
      priceUah: num(price),
      cuisine: mkL(cuisine, keptCuisine),
      difficulty: difficulty || undefined,
      tags: tagsText
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
      ingredients: built,
      steps: builtSteps,
      image: keptImage,
      source: keptSource ?? { type: "manual" },
      createdAt: keptCreatedAt ?? Date.now(),
    };

    addUserRecipe(recipe);
    nav(`/recipe/${recipe.id}`);
  };

  const label = "text-sm font-bold text-flame";
  const input =
    "w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-flame";
  const heading = fromImport ? t.editor.review : editId ? t.editor.editR : t.editor.newR;

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-2xl font-bold text-text">{heading}</h1>
      {fromImport && <p className="mt-1 text-sm text-text-dim">{t.editor.reviewSub}</p>}
      <p className="mt-1 text-xs text-text-faint">{t.editor.langHint}</p>

      <div className="mt-5 space-y-5">
        <div className="space-y-2">
          <div className={label}>{t.editor.title}</div>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(false);
            }}
            placeholder={t.editor.titlePh}
            className={input}
          />
          {error && <div className="text-sm text-danger">{t.editor.needTitle}</div>}
        </div>

        <div className="space-y-2">
          <div className={label}>{t.editor.description}</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={input} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <div className={label}>{t.editor.servings}</div>
            <input value={servings} onChange={(e) => setServings(e.target.value)} inputMode="numeric" className={input} />
          </div>
          <div className="space-y-2">
            <div className={label}>{t.editor.prep}</div>
            <input value={prep} onChange={(e) => setPrep(e.target.value)} inputMode="numeric" className={input} />
          </div>
          <div className="space-y-2">
            <div className={label}>{t.editor.cookMin}</div>
            <input value={cook} onChange={(e) => setCook(e.target.value)} inputMode="numeric" className={input} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className={label}>{t.editor.kcal}</div>
            <input value={kcal} onChange={(e) => setKcal(e.target.value)} inputMode="numeric" className={input} />
          </div>
          <div className="space-y-2">
            <div className={label}>{t.editor.price}</div>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={input} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className={label}>{t.editor.cuisine}</div>
            <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={input} />
          </div>
          <div className="space-y-2">
            <div className={label}>{t.editor.difficulty}</div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
              className={input}
            >
              <option value="">—</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {t.difficulty[d]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className={label}>{t.editor.tags}</div>
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder={t.editor.tagsPh} className={input} />
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <div className={label}>{t.editor.ingredients}</div>
          <div className="space-y-2">
            {ingredients.map((row, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={row.quantity}
                  onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                  inputMode="decimal"
                  placeholder={t.editor.qty}
                  className="w-16 rounded-xl border border-border bg-surface-alt px-2 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-flame"
                />
                <input
                  value={row.unit}
                  onChange={(e) => updateRow(idx, { unit: e.target.value })}
                  placeholder={t.editor.unit}
                  className="w-20 rounded-xl border border-border bg-surface-alt px-2 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-flame"
                />
                <input
                  value={row.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  placeholder={t.editor.ingredient}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-flame"
                />
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="flex w-10 shrink-0 items-center justify-center rounded-xl border border-border text-text-dim hover:border-danger hover:text-danger"
                  aria-label="Remove ingredient"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 rounded-full border border-flame px-3 py-1.5 text-sm text-flame"
          >
            <Plus size={15} /> {t.editor.addIngredient}
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <div className={label}>{t.editor.method}</div>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={t.editor.methodPh}
            rows={7}
            className={input}
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={save} className="flex-1 rounded-xl bg-flame px-4 py-3 text-center font-bold text-bg">
            {t.editor.save}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t.editor.delConfirm)) {
                  removeUserRecipe(editId);
                  nav("/");
                }
              }}
              className="rounded-xl border border-border px-4 py-3 text-danger"
            >
              {t.editor.del}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
