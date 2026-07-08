import { Heart } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { RecipeCard } from "@/components/RecipeCard";
import { useAllRecipes } from "@/data/useRecipes";
import { useLang, useT } from "@/i18n";
import { pickL } from "@/types/recipe";
import { useUserStore } from "@/store/userStore";

export default function Favourites() {
  const t = useT();
  const lang = useLang();
  const all = useAllRecipes();
  const favourites = useUserStore((s) => s.favourites);
  const cooked = useUserStore((s) => s.cooked);

  const favRecipes = useMemo(
    () => favourites.map((id) => all.find((r) => r.id === id)).filter((r): r is NonNullable<typeof r> => !!r),
    [favourites, all],
  );

  const recentlyCooked = useMemo(() => {
    const seen = new Set<string>();
    const out: { title: string; id: string; at: number }[] = [];
    for (const c of cooked) {
      if (seen.has(c.recipeId)) continue;
      const r = all.find((x) => x.id === c.recipeId);
      if (r) {
        out.push({ title: pickL(r.title, lang), id: r.id, at: c.at });
        seen.add(c.recipeId);
      }
    }
    return out.slice(0, 8);
  }, [cooked, all, lang]);

  return (
    <div className="px-4 py-4">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-text">
        <Heart size={22} className="text-flame" /> {t.favs.title}
      </h1>

      {favRecipes.length === 0 ? (
        <div className="py-16 text-center text-text-dim">
          <div className="text-4xl">💛</div>
          <div className="mt-3">{t.favs.empty}</div>
          <div className="mt-1 text-sm text-text-faint">{t.favs.emptyHint}</div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {favRecipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}

      {recentlyCooked.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-flame">{t.favs.recentlyCooked}</h2>
          <div className="mt-2 space-y-2">
            {recentlyCooked.map((c) => (
              <Link
                key={c.id}
                to={`/recipe/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-text"
              >
                <span>{c.title}</span>
                <span className="text-xs text-text-faint">
                  {new Date(c.at).toLocaleDateString(lang === "uk" ? "uk-UA" : "en-GB")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
