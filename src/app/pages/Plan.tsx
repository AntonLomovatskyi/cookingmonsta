import { CalendarDays, ChevronLeft, ChevronRight, Flame, Plus, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useAllRecipes } from "@/data/useRecipes";
import { useLang, useT } from "@/i18n";
import { pickL, type Recipe } from "@/types/recipe";
import { useUserStore } from "@/store/userStore";

/** Local (not UTC) YYYY-MM-DD key, so plans stay on the right day across timezones. */
function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Monday of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const shift = (out.getDay() + 6) % 7; // Mon=0 … Sun=6
  out.setDate(out.getDate() - shift);
  return out;
}

export default function Plan() {
  const t = useT();
  const lang = useLang();
  const all = useAllRecipes();
  const plan = useUserStore((s) => s.plan);
  const addToPlan = useUserStore((s) => s.addToPlan);
  const removeFromPlan = useUserStore((s) => s.removeFromPlan);
  const setShoppingServings = useUserStore((s) => s.setShoppingServings);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [pickerDay, setPickerDay] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sentToast, setSentToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const locale = lang === "uk" ? "uk-UA" : "en-GB";
  const todayKey = dateKey(new Date());

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const byId = useMemo(() => new Map(all.map((r) => [r.id, r])), [all]);

  const weekEntries = useMemo(() => {
    const out: Recipe[] = [];
    for (const d of days) for (const id of plan[dateKey(d)] ?? []) {
      const r = byId.get(id);
      if (r) out.push(r);
    }
    return out;
  }, [days, plan, byId]);

  const weekKcal = weekEntries.reduce((sum, r) => sum + (r.caloriesPerServing ?? 0), 0);
  const weekCost = weekEntries.reduce((sum, r) => sum + (r.priceUah ?? 0), 0);
  const plannedDays = days.filter((d) => (plan[dateKey(d)] ?? []).length > 0).length;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return all
      .filter((r) => r.title.en.toLowerCase().includes(q) || r.title.uk.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, all]);

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(d);
    setPickerDay(null);
  };

  // Idempotent: SETS each planned recipe's servings to one batch per planned occurrence, so
  // pressing again after editing the week corrects the list instead of double-counting.
  const sendWeekToShopping = () => {
    const batches = new Map<string, number>();
    for (const r of weekEntries) batches.set(r.id, (batches.get(r.id) ?? 0) + 1);
    for (const [id, n] of batches) {
      const r = byId.get(id);
      if (r) setShoppingServings(id, (r.servings ?? 1) * n);
    }
    setSentToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setSentToast(false), 2500);
  };

  const weekLabel = `${weekStart.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString(locale, { day: "numeric", month: "short" })}`;
  const isThisWeek = dateKey(weekStart) === dateKey(startOfWeek(new Date()));

  return (
    <div className="px-4 py-4">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-text">
        <CalendarDays size={22} className="text-flame" /> {t.plan.title}
      </h1>

      {/* Week navigation */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface px-2 py-2">
        <button onClick={() => shiftWeek(-1)} className="rounded-full p-1.5 text-text-dim hover:text-flame" aria-label="Previous week">
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setWeekStart(startOfWeek(new Date()))}
          className={clsx("text-sm", isThisWeek ? "font-bold text-flame" : "text-text underline decoration-dotted")}
        >
          {isThisWeek ? t.plan.thisWeek : weekLabel}
        </button>
        <button onClick={() => shiftWeek(1)} className="rounded-full p-1.5 text-text-dim hover:text-flame" aria-label="Next week">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Week summary */}
      {weekEntries.length > 0 && (
        <div className="mt-3 rounded-xl border border-border bg-surface p-3">
          <div className="flex justify-around text-center">
            <div>
              <div className="flex items-center justify-center gap-1 font-display text-lg font-bold text-flame">
                <Flame size={15} /> {weekKcal}
              </div>
              <div className="text-[11px] text-text-dim">{t.plan.weekKcal}</div>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-herb">≈ ₴{weekCost}</div>
              <div className="text-[11px] text-text-dim">{t.plan.weekCost}</div>
            </div>
            <div>
              <div className="font-display text-lg font-bold text-text">
                {plannedDays ? Math.round(weekKcal / plannedDays) : 0}
              </div>
              <div className="text-[11px] text-text-dim">{t.plan.avgDay}</div>
            </div>
          </div>
          <button
            onClick={sendWeekToShopping}
            disabled={sentToast}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-herb/50 bg-herb/10 px-4 py-2.5 text-sm font-bold text-herb disabled:opacity-70"
          >
            <ShoppingCart size={16} /> {sentToast ? t.plan.addedToShopping : t.plan.addToShopping}
          </button>
        </div>
      )}

      {/* Days */}
      <div className="mt-4 space-y-3">
        {days.map((d) => {
          const key = dateKey(d);
          const ids = plan[key] ?? [];
          const isToday = key === todayKey;
          const dayKcal = ids.reduce((sum, id) => sum + (byId.get(id)?.caloriesPerServing ?? 0), 0);
          return (
            <div key={key} className={clsx("rounded-xl border p-3", isToday ? "border-flame/60 bg-flame/5" : "border-border bg-surface")}>
              <div className="flex items-baseline justify-between">
                <div className={clsx("text-sm font-bold capitalize", isToday ? "text-flame" : "text-text")}>
                  {d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" })}
                </div>
                {dayKcal > 0 && <div className="text-[11px] text-text-faint">{dayKcal} {t.detail.kcal}</div>}
              </div>

              {ids.length === 0 && pickerDay !== key && (
                <div className="mt-1 text-xs text-text-faint">{t.plan.nothing}</div>
              )}

              <div className="mt-2 space-y-1.5">
                {ids.map((id, i) => {
                  const r = byId.get(id);
                  if (!r) return null;
                  return (
                    <div key={`${id}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-2.5 py-1.5">
                      {r.image && <img src={r.image} alt="" className="h-7 w-10 shrink-0 rounded object-cover" loading="lazy" />}
                      <Link to={`/recipe/${r.id}`} className="min-w-0 flex-1 truncate text-sm text-text">
                        {pickL(r.title, lang)}
                      </Link>
                      {r.caloriesPerServing != null && (
                        <span className="shrink-0 text-[10px] text-text-faint">{r.caloriesPerServing} {t.detail.kcal}</span>
                      )}
                      <button
                        onClick={() => removeFromPlan(key, i)}
                        className="shrink-0 p-1 text-text-faint hover:text-danger"
                        aria-label="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {pickerDay === key ? (
                <div className="mt-2">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.plan.searchPh}
                    className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2 text-sm text-text outline-none placeholder:text-text-faint focus:border-flame"
                  />
                  <div className="mt-1.5 space-y-1">
                    {matches.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          addToPlan(key, r.id);
                          setQuery("");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left text-sm text-text hover:border-flame/60"
                      >
                        <Plus size={14} className="shrink-0 text-flame" />
                        <span className="min-w-0 flex-1 truncate">{pickL(r.title, lang)}</span>
                        {r.caloriesPerServing != null && (
                          <span className="shrink-0 text-[10px] text-text-faint">{r.caloriesPerServing} {t.detail.kcal}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setPickerDay(null); setQuery(""); }} className="mt-1.5 text-xs text-text-faint underline">
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setPickerDay(key); setQuery(""); }}
                  className="mt-2 flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-text-dim hover:border-flame hover:text-flame"
                >
                  <Plus size={12} /> {t.plan.addRecipe}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
