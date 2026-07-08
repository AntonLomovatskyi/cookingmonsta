import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRecipeById } from "@/data/useRecipes";
import { slugify } from "@/data/recipes";
import { useDraftStore } from "@/store/draftStore";
import { useUserStore } from "@/store/userStore";
import { DIFFICULTIES, type Difficulty, type Ingredient, type Recipe, type RecipeSource } from "@/types/recipe";

interface IngredientRow {
  name: string;
  quantity: string;
  unit: string;
  note: string;
}

const toRow = (i: Ingredient): IngredientRow => ({
  name: i.name,
  quantity: i.quantity != null ? String(i.quantity) : "",
  unit: i.unit ?? "",
  note: i.note ?? "",
});

const blankRow = (): IngredientRow => ({ name: "", quantity: "", unit: "", note: "" });

export default function RecipeNew() {
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

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [servings, setServings] = useState(initial?.servings != null ? String(initial.servings) : "");
  const [prep, setPrep] = useState(initial?.prepMinutes != null ? String(initial.prepMinutes) : "");
  const [cook, setCook] = useState(initial?.cookMinutes != null ? String(initial.cookMinutes) : "");
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(initial?.difficulty ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [steps, setSteps] = useState((initial?.steps ?? []).join("\n"));
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initial?.ingredients.length ? initial.ingredients.map(toRow) : [blankRow()],
  );
  const [error, setError] = useState(false);

  const keptImage = initial?.image;
  const keptSource: RecipeSource | undefined = initial?.source;
  const keptId = initial?.id;
  const keptCreatedAt = initial?.createdAt;

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

  const splitLines = (raw: string) =>
    raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const save = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(true);
      return;
    }
    const built: Ingredient[] = ingredients
      .filter((r) => r.name.trim())
      .map((r) => {
        const out: Ingredient = { name: r.name.trim() };
        const q = r.quantity.trim() ? Number(r.quantity) : undefined;
        if (q != null && !Number.isNaN(q)) out.quantity = q;
        if (r.unit.trim()) out.unit = r.unit.trim();
        if (r.note.trim()) out.note = r.note.trim();
        return out;
      });

    const num = (v: string) => {
      const n = Number(v);
      return v.trim() && !Number.isNaN(n) && n > 0 ? Math.round(n) : undefined;
    };

    const id = keptId ?? slugify(trimmedTitle);
    const recipe: Recipe = {
      id,
      title: trimmedTitle,
      description: description.trim() || undefined,
      servings: num(servings),
      prepMinutes: num(prep),
      cookMinutes: num(cook),
      cuisine: cuisine.trim() || undefined,
      difficulty: difficulty || undefined,
      tags: tagsText
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      ingredients: built,
      steps: splitLines(steps),
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
  const heading = fromImport ? "Review imported recipe" : editId ? "Edit recipe" : "New recipe";

  return (
    <div className="px-4 py-4">
      <h1 className="font-display text-2xl font-bold text-text">{heading}</h1>
      {fromImport && (
        <p className="mt-1 text-sm text-text-dim">Claude did the heavy lifting — check it over, then save.</p>
      )}

      <div className="mt-5 space-y-5">
        <div className="space-y-2">
          <div className={label}>Title</div>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(false);
            }}
            placeholder="e.g. Garlic Butter Pasta"
            className={input}
          />
          {error && <div className="text-sm text-danger">Give it a title.</div>}
        </div>

        <div className="space-y-2">
          <div className={label}>Description</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={input} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <div className={label}>Servings</div>
            <input value={servings} onChange={(e) => setServings(e.target.value)} inputMode="numeric" className={input} />
          </div>
          <div className="space-y-2">
            <div className={label}>Prep (min)</div>
            <input value={prep} onChange={(e) => setPrep(e.target.value)} inputMode="numeric" className={input} />
          </div>
          <div className="space-y-2">
            <div className={label}>Cook (min)</div>
            <input value={cook} onChange={(e) => setCook(e.target.value)} inputMode="numeric" className={input} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className={label}>Cuisine</div>
            <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. Italian" className={input} />
          </div>
          <div className="space-y-2">
            <div className={label}>Difficulty</div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
              className={input}
            >
              <option value="">—</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className={label}>Tags</div>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="dinner, vegetarian, quick (comma-separated)"
            className={input}
          />
        </div>

        {/* Ingredients */}
        <div className="space-y-2">
          <div className={label}>Ingredients</div>
          <div className="space-y-2">
            {ingredients.map((row, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={row.quantity}
                  onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                  inputMode="decimal"
                  placeholder="Qty"
                  className="w-16 rounded-xl border border-border bg-surface-alt px-2 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-flame"
                />
                <input
                  value={row.unit}
                  onChange={(e) => updateRow(idx, { unit: e.target.value })}
                  placeholder="Unit"
                  className="w-20 rounded-xl border border-border bg-surface-alt px-2 py-2.5 text-text outline-none placeholder:text-text-faint focus:border-flame"
                />
                <input
                  value={row.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  placeholder="Ingredient"
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
            <Plus size={15} /> Add ingredient
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <div className={label}>Method</div>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="One step per line"
            rows={7}
            className={input}
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={save} className="flex-1 rounded-xl bg-flame px-4 py-3 text-center font-bold text-bg">
            Save recipe
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete this recipe?")) {
                  removeUserRecipe(editId);
                  nav("/");
                }
              }}
              className="rounded-xl border border-border px-4 py-3 text-danger"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
