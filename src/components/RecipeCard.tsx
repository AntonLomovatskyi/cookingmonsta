import { Clock, Heart, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { totalMinutes, type Recipe } from "@/types/recipe";
import { useUserStore } from "@/store/userStore";

const EMOJI = ["🍳", "🍜", "🥘", "🍲", "🥗", "🌮", "🍛", "🧁", "🥙", "🍤"];
function emojiFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return EMOJI[h % EMOJI.length];
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const favourites = useUserStore((s) => s.favourites);
  const fav = favourites.includes(recipe.id);
  const time = totalMinutes(recipe);

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-flame/60"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-alt">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">{emojiFor(recipe.id)}</div>
        )}
        {fav && (
          <div className="absolute right-2 top-2 rounded-full bg-bg/70 p-1.5 text-flame backdrop-blur">
            <Heart size={14} fill="currentColor" />
          </div>
        )}
        {recipe.source?.type === "youtube" && (
          <div className="absolute left-2 top-2 rounded-full bg-bg/70 p-1.5 text-danger backdrop-blur">
            <Youtube size={14} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <div className="line-clamp-2 text-sm font-semibold text-text">{recipe.title}</div>
        <div className="mt-auto flex items-center gap-2 text-[11px] text-text-faint">
          {time != null && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {time}m
            </span>
          )}
          {recipe.cuisine && <span className="truncate">{recipe.cuisine}</span>}
        </div>
      </div>
    </Link>
  );
}

export function difficultyBadge(difficulty?: string): { label: string; cls: string } | null {
  if (!difficulty) return null;
  const map: Record<string, string> = {
    easy: "text-success border-success/50",
    medium: "text-flame border-flame/50",
    hard: "text-danger border-danger/50",
  };
  return { label: difficulty, cls: clsx("border", map[difficulty] ?? "text-text-dim border-border") };
}
