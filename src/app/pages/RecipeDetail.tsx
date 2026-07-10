import { ChefHat, Clock, Flame, Heart, Minus, Pencil, Play, Plus, ShoppingCart, Trash2, Users, Youtube } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { useRecipeById } from "@/data/useRecipes";
import { getSeedRecipeById } from "@/data/recipes";
import { servingsWord, useLang, useT } from "@/i18n";
import { formatQuantity, scaleIngredient } from "@/lib/scale";
import { pickL, totalMinutes } from "@/types/recipe";
import { useUserStore } from "@/store/userStore";

const DIFF_CLS: Record<string, string> = {
  easy: "border-success/50 text-success",
  medium: "border-flame/50 text-flame",
  hard: "border-danger/50 text-danger",
};

export default function RecipeDetail() {
  const t = useT();
  const lang = useLang();
  const { id } = useParams();
  const nav = useNavigate();
  const recipe = useRecipeById(id);
  const favourites = useUserStore((s) => s.favourites);
  const toggleFavourite = useUserStore((s) => s.toggleFavourite);
  const notes = useUserStore((s) => s.notes);
  const setNote = useUserStore((s) => s.setNote);
  const logCooked = useUserStore((s) => s.logCooked);
  const removeUserRecipe = useUserStore((s) => s.removeUserRecipe);
  const pushRecentlyViewed = useUserStore((s) => s.pushRecentlyViewed);
  const userRecipes = useUserStore((s) => s.userRecipes);
  const shopping = useUserStore((s) => s.shopping);
  const setShoppingServings = useUserStore((s) => s.setShoppingServings);

  const [servings, setServings] = useState(recipe?.servings ?? 0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (recipe) {
      setServings(recipe.servings ?? 0);
      setShowVideo(false);
      pushRecentlyViewed(recipe.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id]);

  const ratio = useMemo(() => {
    if (!recipe?.servings || !servings) return 1;
    return servings / recipe.servings;
  }, [recipe?.servings, servings]);

  if (!recipe) {
    return <div className="px-6 py-16 text-center text-text-dim">{t.detail.notFound}</div>;
  }

  const fav = favourites.includes(recipe.id);
  const time = totalMinutes(recipe);
  const isUserRecipe = userRecipes.some((r) => r.id === recipe.id);
  const isEditableSeed = !isUserRecipe && !!getSeedRecipeById(recipe.id);
  const note = notes[recipe.id] ?? "";

  const onDelete = () => {
    if (window.confirm(t.detail.deleteConfirm)) {
      removeUserRecipe(recipe.id);
      nav("/");
    }
  };

  return (
    <div className="pb-4">
      {/* Cover — or the "bake along" video when playing */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-alt">
        {showVideo && recipe.source?.videoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${recipe.source.videoId}?autoplay=1`}
            title={pickL(recipe.title, lang)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            {recipe.image ? (
              <img src={recipe.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">🍳</div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent p-4">
              <h1 className="font-display text-2xl font-bold text-text drop-shadow">{pickL(recipe.title, lang)}</h1>
            </div>
            {recipe.source?.videoId && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-start justify-center pt-8"
                aria-label={t.detail.bakeAlong}
              >
                <span className="flex items-center gap-2 rounded-full bg-bg/80 px-4 py-2 text-sm font-bold text-flame backdrop-blur transition hover:bg-bg">
                  <Play size={16} fill="currentColor" /> {t.detail.bakeAlong}
                </span>
              </button>
            )}
          </>
        )}
      </div>
      {showVideo && (
        <h1 className="px-4 pt-3 font-display text-2xl font-bold text-text">{pickL(recipe.title, lang)}</h1>
      )}

      <div className="px-4">
        {recipe.description && <p className="mt-3 text-sm text-text-dim">{pickL(recipe.description, lang)}</p>}

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {time != null && (
            <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-text-dim">
              <Clock size={13} /> {time} {t.detail.min}
            </span>
          )}
          {recipe.servings != null && (
            <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-text-dim">
              <Users size={13} /> {recipe.servings} {t.detail.base}
            </span>
          )}
          {recipe.caloriesPerServing != null && (
            <span className="flex items-center gap-1 rounded-full border border-flame/50 px-2.5 py-1 text-flame">
              <Flame size={13} /> {recipe.caloriesPerServing} {t.detail.kcal} {t.detail.perServing}
            </span>
          )}
          {recipe.priceUah != null && (
            <span className="rounded-full border border-herb/50 px-2.5 py-1 text-herb">
              ≈ ₴{recipe.priceUah} {t.detail.perServing}
            </span>
          )}
          {recipe.difficulty && (
            <span className={clsx("rounded-full border px-2.5 py-1", DIFF_CLS[recipe.difficulty])}>
              {t.difficulty[recipe.difficulty]}
            </span>
          )}
          {recipe.cuisine && (
            <span className="rounded-full border border-border px-2.5 py-1 text-text-dim">
              {pickL(recipe.cuisine, lang)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link
            to={`/recipe/${recipe.id}/cook`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-flame px-4 py-3 font-bold text-bg"
          >
            <ChefHat size={18} /> {t.detail.cook}
          </Link>
          <button
            onClick={() => toggleFavourite(recipe.id)}
            aria-label="Favourite"
            className={clsx(
              "flex w-12 items-center justify-center rounded-xl border",
              fav ? "border-flame bg-flame/15 text-flame" : "border-border text-text-dim",
            )}
          >
            <Heart size={18} fill={fav ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() =>
              shopping[recipe.id] ? setShoppingServings(recipe.id, 0) : setShoppingServings(recipe.id, servings || recipe.servings || 1)
            }
            aria-label={shopping[recipe.id] ? t.detail.onList : t.detail.addToList}
            title={shopping[recipe.id] ? t.detail.onList : t.detail.addToList}
            className={clsx(
              "flex w-12 items-center justify-center rounded-xl border",
              shopping[recipe.id] ? "border-herb bg-herb/15 text-herb" : "border-border text-text-dim",
            )}
          >
            <ShoppingCart size={18} />
          </button>
          {(isUserRecipe || isEditableSeed) && (
            <Link
              to={`/recipe/new?edit=${recipe.id}`}
              aria-label="Edit"
              className="flex w-12 items-center justify-center rounded-xl border border-border text-text-dim"
            >
              <Pencil size={18} />
            </Link>
          )}
          {isUserRecipe && (
            <button
              onClick={onDelete}
              aria-label="Delete"
              className="flex w-12 items-center justify-center rounded-xl border border-border text-danger"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {recipe.source?.url && (
          <a
            href={recipe.source.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-2 text-sm text-text-dim hover:text-flame"
          >
            <Youtube size={16} className="text-danger" />
            {recipe.source.author ? `${t.detail.from} ${recipe.source.author}` : t.detail.watch}
          </a>
        )}

        {/* Ingredients with servings scaler */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-flame">{t.detail.ingredients}</h2>
            {recipe.servings != null && (
              <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                <button
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="text-text-dim hover:text-flame"
                  aria-label="Fewer servings"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-14 text-center text-sm text-text">
                  {servings} {servingsWord(servings, lang)}
                </span>
                <button
                  onClick={() => setServings((s) => s + 1)}
                  className="text-text-dim hover:text-flame"
                  aria-label="More servings"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
          <ul className="mt-3 space-y-1.5">
            {recipe.ingredients.map((ing, i) => {
              const scaled = scaleIngredient(ing, ratio);
              const noteText = pickL(ing.note, lang);
              return (
                <li key={i} className="flex gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
                  <span className="text-flame">•</span>
                  <span className="text-text">
                    {scaled.quantity != null && (
                      <span className="font-semibold">
                        {formatQuantity(scaled.quantity)}
                        {scaled.unit ? ` ${pickL(scaled.unit, lang)}` : ""}{" "}
                      </span>
                    )}
                    {pickL(ing.name, lang)}
                    {noteText && <span className="text-text-faint"> — {noteText}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Steps */}
        <div className="mt-6">
          <h2 className="font-display text-lg font-bold text-flame">{t.detail.method}</h2>
          <ol className="mt-3 space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-flame/15 text-xs font-bold text-flame">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-text">{pickL(step, lang)}</span>
              </li>
            ))}
          </ol>
        </div>

        {recipe.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {recipe.tags.map((tg) => (
              <span key={tg} className="rounded-full border border-border px-2.5 py-1 text-xs text-text-dim">
                #{tg}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        <div className="mt-6">
          <h2 className="font-display text-lg font-bold text-flame">{t.detail.notes}</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(recipe.id, e.target.value)}
            placeholder={t.detail.notesPh}
            rows={3}
            className="mt-2 w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-faint focus:border-flame"
          />
        </div>

        <button
          onClick={() => {
            logCooked(recipe.id);
            window.alert(t.detail.loggedMsg);
          }}
          className="mt-6 w-full rounded-xl border border-herb/50 bg-herb/10 px-4 py-3 font-bold text-herb"
        >
          {t.detail.cookedBtn}
        </button>
      </div>
    </div>
  );
}
