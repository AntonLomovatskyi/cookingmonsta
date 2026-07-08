---
name: import-recipe
description: Import a recipe from a YouTube cooking video into cookingmonsta — fetches the video, extracts a structured recipe (ingredients + steps), commits it to src/data/imported.ts, and pushes so GitHub Pages redeploys. Use when the user gives a YouTube link and wants it added as a recipe, e.g. "/import-recipe <url>" or "add this video to my recipes".
---

# Import a recipe from YouTube (subscription-covered path)

You are the extractor — do NOT call the Anthropic API and do NOT use the in-app `src/lib/ai.ts`
path. Read the video content yourself and structure the recipe. This runs entirely under the
user's Claude subscription.

## Steps

1. **Fetch the video metadata** (no API key needed):

   ```bash
   node scripts/fetch-youtube.mjs "<url-or-video-id>"
   ```

   This prints JSON with `videoId`, `url`, `title`, `author`, `description`, `thumbnail`.

2. **If `description` is empty or clearly has no recipe**, tell the user what you found in the
   title and ask them to paste the description / recipe text (or a pinned comment) into the chat.
   Do not invent a recipe from the title alone.

3. **Extract the recipe** from the title + description (+ anything the user pasted) into the
   `Recipe` shape defined in `src/types/recipe.ts`:
   - Keep the recipe in the same language as the source.
   - Ingredients: separate `name`, numeric `quantity`, free-text `unit` ("g", "ml", "tbsp",
     "clove", …), optional `note` ("finely chopped", "to taste"). Split combined lines.
   - Steps: clear, ordered, imperative sentences. Ignore sponsor blurbs, links, hashtags,
     subscribe pleas and unrelated chatter.
   - Only set `servings` / `prepMinutes` / `cookMinutes` / `cuisine` / `difficulty` when
     reasonably supported by the source; omit otherwise.
   - Add a few lowercase `tags` (meal type, diet, method, cuisine feel).
   - `id`: lowercase-kebab slug of the title (unique vs existing recipes in `src/data/imported.ts`
     and `src/data/seed.ts` — suffix `-2` etc. on collision).
   - `image`: the `thumbnail` from step 1.
   - `source`: `{ type: "youtube", url, videoId, author }`.
   - `createdAt`: current epoch ms (`Date.now()` value — compute it, don't write the call).

4. **Prepend the recipe object** to the `IMPORTED_RECIPES` array in `src/data/imported.ts`
   (newest first).

5. **Verify**: `pnpm typecheck && pnpm build` must pass.

6. **Show the user a short summary** of the extracted recipe (title, ingredient count, step
   count) and then commit and push:

   ```bash
   git add src/data/imported.ts && git commit -m "Add recipe: <title>" && git push
   ```

   The push triggers the Pages deploy; the recipe appears at
   https://antonlomovatskyi.github.io/cookingmonsta/ on all devices in ~1 minute.

## Notes

- Multiple recipes in one video: ask the user which one they want (or import each as its own
  entry if they say "all").
- Comments aren't fetched by the script; if the user says the recipe is in a pinned comment,
  ask them to paste it.
