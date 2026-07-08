import type { Recipe } from "@/types/recipe";

/**
 * Recipes imported via the `/import-recipe` Claude Code skill (see .claude/skills/import-recipe).
 * These are committed to the repo and bundled into the deploy, so they appear on every device
 * without needing an API key or Firebase sync. Newest first.
 *
 * The in-app YouTube import (Settings → Anthropic API key) still exists for on-the-go imports;
 * those land in localStorage/Firestore instead of here.
 */
export const IMPORTED_RECIPES: Recipe[] = [];
