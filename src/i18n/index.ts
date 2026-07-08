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
