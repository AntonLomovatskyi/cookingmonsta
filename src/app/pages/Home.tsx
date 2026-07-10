import { ArrowDownUp, Dices, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chip } from "@/components/Chip";
import { RecipeCard } from "@/components/RecipeCard";
import { Roulette } from "@/components/Roulette";
import { useAllRecipes, useAllTags } from "@/data/useRecipes";
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
  const tags = useAllTags();
  const { query, tags: activeTags, sort, setQuery, toggleTag, setSort } = useFilterStore();
  const cooked = useUserStore((s) => s.cooked);
  const [showRoulette, setShowRoulette] = useState(false);

  const cookCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cooked) m.set(c.recipeId, (m.get(c.recipeId) ?? 0) + 1);
    return m;
  }, [cooked]);

  const list = useMemo(() => {
    let base = all.filter((r) => matches(r, query));
    if (activeTags.length) base = base.filter((r) => activeTags.every((tg) => r.tags.includes(tg)));
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
  }, [all, query, activeTags, sort, cookCounts, lang]);

  const cycleSort = () => {
    const i = SORT_KEYS.indexOf(sort);
    setSort(SORT_KEYS[(i + 1) % SORT_KEYS.length]);
  };

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

      <div className="mt-3 flex items-center gap-2 px-4">
        <button
          onClick={cycleSort}
          className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-text-dim"
        >
          <ArrowDownUp size={14} /> {t.home.sort[sort]}
        </button>
        <button
          onClick={() => setShowRoulette(true)}
          className="flex items-center gap-1 rounded-full border border-flame px-3 py-1.5 text-sm text-flame"
        >
          <Dices size={14} /> {t.roulette.button}
        </button>
        <span className="text-xs text-text-faint">
          {list.length} {t.home.count}
        </span>
      </div>

      {showRoulette && <Roulette onClose={() => setShowRoulette(false)} />}

      {tags.length > 0 && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4">
          {tags.slice(0, 20).map((tg) => (
            <Chip key={tg} label={tg} selected={activeTags.includes(tg)} onClick={() => toggleTag(tg)} />
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
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
