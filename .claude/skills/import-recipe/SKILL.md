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
   - **BILINGUAL**: every text field is an `L10n` pair `{ en, uk }` — write BOTH English and
     Ukrainian, translating whichever the source lacks (natural cooking language, not literal).
   - **UNITS — metric/spoons/counts ONLY**: g/г, ml/мл, tbsp/ст. л., tsp/ч. л., or countable
     pieces (eggs, cloves/зубчики). NEVER cups, oz, lb or sticks — convert them (1 cup flour
     ≈ 125 g, 1 cup sugar ≈ 200 g, 1 cup butter ≈ 227 g, 1 cup liquid = 240 ml, 1 stick butter
     = 113 g, 1 oz = 28 g). Prefer the source's own gram values when given alongside cups.
   - Ingredients: `name` (L10n), numeric `quantity`, `unit` (L10n), optional `note` (L10n).
     Split combined lines.
   - Steps: `L10n[]` — clear, ordered, imperative sentences in both languages. Ignore sponsor
     blurbs, links, hashtags, subscribe pleas and unrelated chatter.
   - Only set `servings` / `prepMinutes` / `cookMinutes` / `cuisine` (L10n) / `difficulty` when
     reasonably supported by the source; omit otherwise.
   - **`caloriesPerServing`**: estimate kcal per serving from the ingredient amounts.
   - **`priceUah`**: estimate the ingredient cost PER SERVING in ₴ at Ukrainian supermarket prices.
   - Add a few lowercase ENGLISH `tags` (meal type, diet, method, cuisine feel).
   - `id`: lowercase-kebab slug of the English title (unique vs existing recipes in
     `src/data/imported.ts` and `src/data/seed.ts` — suffix `-2` etc. on collision).
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
