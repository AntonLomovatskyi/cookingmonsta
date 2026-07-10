import { ArrowDownUp, Dices, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { RecipeCard } from "@/components/RecipeCard";
import { Roulette } from "@/components/Roulette";
import { CATEGORIES, CATEGORY_EMOJI, categorize, type Category } from "@/domain/categories";
import { useAllRecipes } from "@/data/useRecipes";
import { useLang, useT } from "@/i18n";
import { pickL, totalMinutes, type Lang, type Recipe } from "@/types/recipe";
import { useFilterStore, type SortMode } from "@/store/filterStore";
import { useUserStore } from "@/store/userStore";

const SORT_KEYS: SortMode[] = ["recent", "title", "time", "cooked"];

function matches(r: Recipe, q: string): boolean {
  if (!q) return true;
  const hay = [
    r.title.en,
    r.title.uk,
    r.cuisine?.en,
    r.cuisine?.uk,
    ...r.tags,
    ...r.ingredients.flatMap((i) => [i.name.en, i.name.uk]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((term) => hay.includes(term));
}

export default function Home() {
  const t = useT();
  const lang: Lang = useLang();
  const nav = useNavigate();
  const all = useAllRecipes();
  const { query, category, quick, cheap, light, sort, setQuery, setCategory, toggleQuick, toggleCheap, toggleLight, setSort } =
    useFilterStore();
  const cooked = useUserStore((s) => s.cooked);
  const [showRoulette, setShowRoulette] = useState(false);

  const cookCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cooked) m.set(c.recipeId, (m.get(c.recipeId) ?? 0) + 1);
    return m;
  }, [cooked]);

  const categoryOf = useMemo(() => {
    const m = new Map<string, Category>();
    for (const r of all) m.set(r.id, categorize(r));
    return m;
  }, [all]);

  const counts = useMemo(() => {
    const m = new Map<Category, number>();
    for (const r of all) {
      const c = categoryOf.get(r.id)!;
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    m.set("all", all.length);
    return m;
  }, [all, categoryOf]);

  const list = useMemo(() => {
    let base = all.filter((r) => matches(r, query));
    if (category !== "all") base = base.filter((r) => categoryOf.get(r.id) === category);
    if (quick) base = base.filter((r) => (totalMinutes(r) ?? 999) <= 30);
    if (cheap) base = base.filter((r) => (r.priceUah ?? 999) <= 25);
    if (light) base = base.filter((r) => (r.caloriesPerServing ?? 999) <= 300);
    const sorted = [...base];
    sorted.sort((a, b) => {
      switch (sort) {
        case "title":
          return pickL(a.title, lang).localeCompare(pickL(b.title, lang), lang);
        case "time":
          return (totalMinutes(a) ?? 9999) - (totalMinutes(b) ?? 9999);
        case "cooked":
          return (cookCounts.get(b.id) ?? 0) - (cookCounts.get(a.id) ?? 0);
        default:
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      }
    });
    return sorted;
  }, [all, query, category, categoryOf, quick, cheap, light, sort, cookCounts, lang]);

  const cycleSort = () => {
    const i = SORT_KEYS.indexOf(sort);
    setSort(SORT_KEYS[(i + 1) % SORT_KEYS.length]);
  };

  const filterChip = (active: boolean) =>
    clsx(
      "shrink-0 rounded-full border px-3 py-1.5 text-sm transition",
      active ? "border-flame bg-flame/15 text-flame" : "border-border text-text-dim hover:border-flame/60",
    );

  return (
    <div>
      <div className="px-4 pt-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.home.search}
            className="w-full rounded-xl border border-border bg-surface-alt py-2.5 pl-9 pr-3 text-text outline-none placeholder:text-text-faint focus:border-flame"
          />
        </div>
      </div>

      {/* Import hero */}
      <Link
        to="/import"
        className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-flame/40 bg-flame/10 p-3 transition hover:bg-flame/15"
      >
        <div className="rounded-full bg-flame/20 p-2 text-flame">
          <Sparkles size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-flame">{t.home.importTitle}</div>
          <div className="truncate text-xs text-text-dim">{t.home.importSub}</div>
        </div>
      </Link>

      {/* Category shelves */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        {CATEGORIES.map((c) => {
          const n = counts.get(c) ?? 0;
          if (c !== "all" && n === 0) return null;
          return (
            <button key={c} onClick={() => setCategory(c)} className={filterChip(category === c)}>
              {CATEGORY_EMOJI[c]} {t.home.categories[c]} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {/* Smart filters + sort + roulette */}
      <div className="no-scrollbar mt-2 flex items-center gap-2 overflow-x-auto px-4">
        <button onClick={toggleQuick} className={filterChip(quick)}>
          ⏱ {t.home.fQuick}
        </button>
        <button onClick={toggleCheap} className={filterChip(cheap)}>
          💸 {t.home.fCheap}
        </button>
        <button onClick={toggleLight} className={filterChip(light)}>
          🌿 {t.home.fLight}
        </button>
        <button
          onClick={cycleSort}
          className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-text-dim"
        >
          <ArrowDownUp size={14} /> {t.home.sort[sort]}
        </button>
        <button
          onClick={() => setShowRoulette(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-flame px-3 py-1.5 text-sm text-flame"
        >
          <Dices size={14} /> {t.roulette.button}
        </button>
      </div>

      {showRoulette && <Roulette onClose={() => setShowRoulette(false)} />}

      <div className="px-4 pt-2 text-xs text-text-faint">
        {list.length} {t.home.count}
      </div>

      <div className="mt-1 grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
        {list.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>

      {list.length === 0 && (
        <div className="px-6 py-16 text-center text-text-dim">
          <div className="text-4xl">🍽️</div>
          <div className="mt-3">{t.home.none}</div>
          <button onClick={() => nav("/import")} className="mt-4 rounded-full bg-flame px-4 py-2 font-bold text-bg">
            {t.home.importFirst}
          </button>
        </div>
      )}
    </div>
  );
}
