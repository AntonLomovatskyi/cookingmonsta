/**
 * Reactive recipe access that merges bundled seed recipes with the user's own (from the store).
 * User recipes win on id collisions and sort first, so an edited copy shadows its seed original.
 */
import { useMemo } from "react";
import type { Recipe } from "@/types/recipe";
import { useUserStore } from "@/store/userStore";
import { getSeedRecipes, getSeedRecipeById } from "./recipes";

export function useAllRecipes(): Recipe[] {
  const userRecipes = useUserStore((s) => s.userRecipes);
  return useMemo(() => {
    const userIds = new Set(userRecipes.map((r) => r.id));
    const seed = getSeedRecipes().filter((r) => !userIds.has(r.id));
    return [...userRecipes, ...seed];
  }, [userRecipes]);
}

export function useRecipeById(id: string | undefined): Recipe | undefined {
  const userRecipes = useUserStore((s) => s.userRecipes);
  return useMemo(() => {
    if (!id) return undefined;
    return userRecipes.find((r) => r.id === id) ?? getSeedRecipeById(id);
  }, [id, userRecipes]);
}

/** All distinct tags across the catalog, most-common first. */
export function useAllTags(): string[] {
  const all = useAllRecipes();
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of all) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [all]);
}
