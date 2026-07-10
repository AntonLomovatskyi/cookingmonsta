/** Active UI strings + language, reactive to the user's language setting. */
import { useUserStore } from "@/store/userStore";
import { en, type Strings } from "./en";
import { uk } from "./uk";
import type { Lang } from "@/types/recipe";

export type { Strings };

export function useT(): Strings {
  const lang = useUserStore((s) => s.language);
  return lang === "uk" ? uk : en;
}

export function useLang(): Lang {
  return useUserStore((s) => s.language);
}

/** Correct plural for "N servings" — Ukrainian needs three forms (1 порція / 2–4 порції / 5+ порцій). */
export function servingsWord(n: number, lang: Lang): string {
  if (lang === "uk") {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "порція";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "порції";
    return "порцій";
  }
  return n === 1 ? "serving" : "servings";
}
