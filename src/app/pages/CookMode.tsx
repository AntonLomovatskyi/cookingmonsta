import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { useRecipeById } from "@/data/useRecipes";
import { useLang, useT } from "@/i18n";
import { pickL } from "@/types/recipe";
import { useUserStore } from "@/store/userStore";

export default function CookMode() {
  const t = useT();
  const lang = useLang();
  const { id } = useParams();
  const nav = useNavigate();
  const recipe = useRecipeById(id);
  const logCooked = useUserStore((s) => s.logCooked);
  const [step, setStep] = useState(0);

  if (!recipe) {
    return <div className="px-6 py-16 text-center text-text-dim">{t.detail.notFound}</div>;
  }

  const steps = recipe.steps.length ? recipe.steps.map((s) => pickL(s, lang)) : [t.cookMode.noSteps];
  const last = step >= steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  const finish = () => {
    logCooked(recipe.id);
    nav(`/recipe/${recipe.id}`);
  };

  return (
    <div className="flex min-h-full flex-col px-4 py-4">
      <div className="text-sm text-text-dim">{pickL(recipe.title, lang)}</div>

      {/* Progress */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <div className="h-full bg-flame transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 text-xs text-text-faint">
        {t.cookMode.step} {step + 1} {t.cookMode.of} {steps.length}
      </div>

      {/* Current step */}
      <div className="mt-6 flex flex-1 flex-col justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-flame/15 text-xl font-bold text-flame">
          {step + 1}
        </div>
        <p className="mt-4 font-display text-2xl leading-snug text-text">{steps[step]}</p>
      </div>

      {/* Ingredient reference */}
      <details className="mt-4 rounded-xl border border-border bg-surface p-3">
        <summary className="cursor-pointer text-sm font-semibold text-flame">{t.cookMode.ingredients}</summary>
        <ul className="mt-2 space-y-1 text-sm text-text-dim">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>
              {ing.quantity != null && (
                <span className="text-text">
                  {ing.quantity}
                  {ing.unit ? ` ${pickL(ing.unit, lang)}` : ""}{" "}
                </span>
              )}
              {pickL(ing.name, lang)}
            </li>
          ))}
        </ul>
      </details>

      {/* Nav */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className={clsx(
            "flex w-14 items-center justify-center rounded-xl border border-border",
            step === 0 ? "text-text-faint" : "text-text-dim",
          )}
          aria-label="Previous step"
        >
          <ChevronLeft size={20} />
        </button>
        {last ? (
          <button
            onClick={finish}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-herb px-4 py-3 font-bold text-bg"
          >
            <Check size={18} /> {t.cookMode.done}
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-flame px-4 py-3 font-bold text-bg"
          >
            {t.cookMode.next} <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
