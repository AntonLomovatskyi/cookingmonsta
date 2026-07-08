# cookingmonsta 🍳

A personal recipe app with one killer trick: **paste a YouTube cooking video and it extracts the
ingredients and steps for you** (via Claude). Offline-first, on-device, deployed static to GitHub
Pages with optional Firebase cross-device sync — same stack as its sibling app _gaybar_.

## The magic feature

1. Go to **Import**, paste a YouTube link.
2. The app fetches the video's title, description and top comments.
3. **Claude** (default: Haiku 4.5 — cheap & fast; switchable to Sonnet 5 / Opus 4.8 / Fable 5 in
   Settings) reads them and returns a structured recipe.
4. You review & tweak, then save it to your collection.

Claude is called **directly from the browser** with **your own Anthropic API key**, entered in
Settings and kept only in this browser's `localStorage` (never bundled into the deploy, never synced
to the cloud). That keeps the app fully static — no backend, no server-side secrets.

### Free alternative: `/import-recipe` via Claude Code

The in-app path needs API credits (separate from a Claude Pro/Max subscription). If you have a
subscription, use the bundled **Claude Code skill** instead — it's covered by your plan:

```
# in Claude Code, inside this repo
/import-recipe https://youtube.com/watch?v=…
```

Claude Code fetches the video (`scripts/fetch-youtube.mjs`, no API key needed), extracts the
recipe itself, commits it to `src/data/imported.ts`, and pushes — the Pages deploy puts it on all
your devices in about a minute. Phone-friendly on-the-go imports still use the in-app API path.

## Run

```bash
pnpm install
pnpm dev          # local dev server
pnpm build        # static build -> dist/
pnpm preview      # preview the build
pnpm typecheck    # tsc --noEmit
```

## Keys you enter in-app (Settings)

- **Anthropic API key** — required for import. Get one at
  [console.anthropic.com](https://console.anthropic.com/settings/keys).
- **YouTube Data API key** — _optional_. Lets the app auto-fetch a video's description & comments.
  Without it, paste the description into the box yourself (works for any recipe text, not just
  YouTube). Create one in Google Cloud console → enable "YouTube Data API v3" → API key.

## Architecture

- **`src/app/`** — screens (react-router): Home (browse), Recipe detail (with a live servings
  scaler), Cook mode (step-by-step), Import (the AI flow), editor, Favourites, Settings.
- **`src/lib/`** — `youtube.ts` (oEmbed + Data API fetch), `ai.ts` (Claude extraction, Structured
  Outputs), `firebase.ts` + `sync.ts` (optional Google-account sync), `scale.ts`.
- **`src/data/`** — data seam (`useRecipes`), bundled `seed.ts` starter recipes.
- **`src/store/`** — zustand: `userStore` (persisted; API keys excluded from the synced subset),
  transient `filterStore` / `draftStore`.
- **`src/types/recipe.ts`** — zod schema = source of truth for the recipe model.

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy-pages.yml`. Firebase web config (public/safe) is
injected from repo **Variables** (`VITE_FIREBASE_*`). See [docs/firebase-sync.md](docs/firebase-sync.md)
for the one-time Firebase console setup.
