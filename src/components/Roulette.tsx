import { Clock, Dices, Flame, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Chip } from "@/components/Chip";
import { useAllRecipes } from "@/data/useRecipes";
import { useLang, useT } from "@/i18n";
import { pickL, totalMinutes, type Recipe } from "@/types/recipe";

type Mood = "quick" | "cheap" | "chocolate" | "cheesecake";

/** Full-screen "what to bake today?" slot machine. Filters narrow the pool; empty pool falls back to all. */
export function Roulette({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const nav = useNavigate();
  const all = useAllRecipes();

  const [moods, setMoods] = useState<Mood[]>([]);
  const [flash, setFlash] = useState<Recipe | null>(null);
  const [picked, setPicked] = useState<Recipe | null>(null);
  const [rolling, setRolling] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const pool = useMemo(() => {
    let p = all;
    if (moods.includes("quick")) p = p.filter((r) => (totalMinutes(r) ?? 999) <= 30);
    if (moods.includes("cheap")) p = p.filter((r) => (r.priceUah ?? 999) <= 25);
    if (moods.includes("chocolate")) p = p.filter((r) => r.tags.includes("chocolate"));
    if (moods.includes("cheesecake")) p = p.filter((r) => r.tags.includes("cheesecake"));
    return p.length ? p : all;
  }, [all, moods]);

  const toggleMood = (m: Mood) => {
    setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
    setPicked(null);
  };

  const spin = () => {
    if (rolling || pool.length === 0) return;
    setRolling(true);
    setPicked(null);
    const final = pool[Math.floor(Math.random() * pool.length)];
    let tick = 0;
    const roll = () => {
      setFlash(pool[Math.floor(Math.random() * pool.length)]);
      tick += 1;
      if (tick < 14) {
        timers.current.push(window.setTimeout(roll, 50 + tick * 14));
      } else {
        setFlash(null);
        setPicked(final);
        setRolling(false);
      }
    };
    roll();
  };

  const MOODS: { key: Mood; label: string }[] = [
    { key: "quick", label: t.roulette.fQuick },
    { key: "cheap", label: t.roulette.fCheap },
    { key: "chocolate", label: t.roulette.fChocolate },
    { key: "cheesecake", label: t.roulette.fCheesecake },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-flame">🎲 {t.roulette.title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-text-dim hover:text-flame" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Chip key={m.key} label={m.label} selected={moods.includes(m.key)} onClick={() => toggleMood(m.key)} />
          ))}
        </div>

        {/* The wheel */}
        <div className="mt-4 flex min-h-44 items-center justify-center rounded-xl border border-border bg-surface-alt p-4">
          {rolling && flash ? (
            <div className="text-center font-display text-lg text-text-dim blur-[0.5px]">{pickL(flash.title, lang)}</div>
          ) : picked ? (
            <div className="w-full text-center">
              {picked.image && (
                <img src={picked.image} alt="" className="mx-auto aspect-video w-full rounded-lg object-cover" />
              )}
              <div className="mt-2 font-display text-lg font-bold text-text">{pickL(picked.title, lang)}</div>
              <div className="mt-1 flex items-center justify-center gap-3 text-xs text-text-dim">
                {totalMinutes(picked) != null && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {totalMinutes(picked)} {t.detail.min}
                  </span>
                )}
                {picked.caloriesPerServing != null && (
                  <span className="flex items-center gap-1">
                    <Flame size={12} /> {picked.caloriesPerServing} {t.detail.kcal}
                  </span>
                )}
                {picked.priceUah != null && <span>₴{picked.priceUah}</span>}
              </div>
            </div>
          ) : (
            <Dices size={44} className={clsx("text-flame", rolling && "animate-spin")} />
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {picked ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  nav(`/recipe/${picked.id}`);
                }}
                className="flex-1 rounded-xl bg-flame px-4 py-3 font-bold text-bg"
              >
                {t.roulette.open}
              </button>
              <button onClick={spin} className="rounded-xl border border-flame px-4 py-3 font-bold text-flame">
                🎲 {t.roulette.again}
              </button>
            </>
          ) : (
            <button
              onClick={spin}
              disabled={rolling}
              className="flex-1 rounded-xl bg-flame px-4 py-3 font-bold text-bg disabled:opacity-70"
            >
              🎲 {t.roulette.spin}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
