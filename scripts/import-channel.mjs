#!/usr/bin/env node
/**
 * Batch-import every recipe video from a YouTube channel into the app.
 *
 *   ANTHROPIC_API_KEY=sk-ant-… node scripts/import-channel.mjs [@handle] [--limit N] [--model id]
 *
 * Defaults: handle @calmingmomentss, model claude-haiku-4-5.
 *
 * What it does:
 *   1. Lists ALL uploads of the channel (YouTube Data API; key from YT_API_KEY env or the app's
 *      baked-in public key).
 *   2. Keeps only videos whose description actually contains a recipe (≥3 measurement-looking
 *      lines) — shorts and "full recipe on my channel" pointers are skipped.
 *   3. Skips videos already imported (by videoId, across src/data/imported.ts and the output file).
 *   4. Extracts each recipe with Claude — SAME contract as the in-app importer: bilingual en/uk,
 *      metric/spoons/counts only (никаких cups/oz), kcal + ₴ per serving estimates.
 *   5. Validates, then merges into src/data/imported/a-little-calm.json (bundled into the app).
 *
 * Re-runnable: already-imported videos are skipped, so this doubles as "sync channel".
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = path.join(ROOT, "src/data/imported/a-little-calm.json");
const IMPORTED_TS = path.join(ROOT, "src/data/imported.ts");

// ---------- CLI ----------
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
// positionals = args that aren't --flags or their values
const positionals = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const handle = (positionals[0] ?? "@calmingmomentss").replace(/^@/, "");
const MODEL = flag("model", "claude-haiku-4-5");
const LIMIT = Number(flag("limit", "0")) || Infinity;
const CONCURRENCY = 3;

const YT_KEY = process.env.YT_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!YT_KEY || !ANTHROPIC_KEY) {
  console.error(
    "Set YT_API_KEY and ANTHROPIC_API_KEY. Example:\n" +
      "  YT_API_KEY=AIza… ANTHROPIC_API_KEY=sk-ant-… node scripts/import-channel.mjs",
  );
  process.exit(1);
}

// ---------- YouTube ----------
async function yt(url) {
  const res = await fetch(url);
  const j = await res.json();
  if (j.error) throw new Error(`YouTube API: ${j.error.message}`);
  return j;
}

async function listRecipeVideos() {
  const ch = await yt(
    `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=${handle}&key=${YT_KEY}`,
  );
  const item = ch.items?.[0];
  if (!item) throw new Error(`Channel @${handle} not found`);
  const channelId = item.id;
  const author = item.snippet.title;
  const uploads = "UU" + channelId.slice(2);

  const ids = [];
  let page = "";
  do {
    const d = await yt(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploads}&maxResults=50&key=${YT_KEY}${page ? `&pageToken=${page}` : ""}`,
    );
    ids.push(...(d.items ?? []).map((i) => i.contentDetails.videoId));
    page = d.nextPageToken ?? "";
  } while (page);

  const videos = [];
  for (let i = 0; i < ids.length; i += 50) {
    const d = await yt(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids.slice(i, i + 50).join(",")}&key=${YT_KEY}`,
    );
    for (const it of d.items ?? []) {
      videos.push({
        id: it.id,
        title: it.snippet.title,
        publishedAt: it.snippet.publishedAt,
        description: it.snippet.description,
      });
    }
  }

  const qty = /(\d[\d/.\s]*\s*(cups?|tsp|tbsp|teaspoons?|tablespoons?)\b)|\(\s*\d+\s*(g|ml)\s*\)/gi;
  const withRecipe = videos.filter((v) => (v.description.match(qty) ?? []).length >= 3);
  withRecipe.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  return { author, videos: withRecipe, total: videos.length };
}

// ---------- Claude extraction (same contract as src/lib/ai.ts) ----------
const L10N = {
  type: "object",
  additionalProperties: false,
  properties: { en: { type: "string" }, uk: { type: "string" } },
  required: ["en", "uk"],
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: L10N,
    description: L10N,
    servings: { type: "integer" },
    prepMinutes: { type: "integer" },
    cookMinutes: { type: "integer" },
    cuisine: L10N,
    difficulty: { type: "string", enum: ["easy", "medium", "hard", ""] },
    tags: { type: "array", items: { type: "string" } },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { name: L10N, quantity: { type: "number" }, unit: L10N, note: L10N },
        required: ["name", "quantity", "unit", "note"],
      },
    },
    steps: { type: "array", items: L10N },
    caloriesPerServing: { type: "integer" },
    priceUah: { type: "integer" },
  },
  required: [
    "title",
    "description",
    "servings",
    "prepMinutes",
    "cookMinutes",
    "cuisine",
    "difficulty",
    "tags",
    "ingredients",
    "steps",
    "caloriesPerServing",
    "priceUah",
  ],
};

const SYSTEM = `You extract a single cooking recipe from a YouTube video's title and description.

Rules:
- BILINGUAL: produce EVERY text field in BOTH English (en) and Ukrainian (uk) — natural, idiomatic
  cooking language, not word-for-word.
- UNITS: metric or spoons or counts ONLY — grams (g/г), millilitres (ml/мл), tablespoons
  (tbsp/ст. л.), teaspoons (tsp/ч. л.), or countable pieces (eggs, cloves/зубчики). NEVER cups,
  ounces, pounds or sticks: convert them (1 cup flour ≈ 125 g, 1 cup sugar ≈ 200 g, 1 cup butter
  ≈ 227 g, 1 cup liquid = 240 ml, 1 stick butter = 113 g, 1 oz = 28 g). When the source gives
  grams alongside cups, use the gram value.
- The description is often just grouped ingredient lists with baking notes (temps, rest times).
  COMPOSE clear, ordered, imperative preparation steps from those groups and notes — mixing order
  follows the groups; include rests, temperatures and bake times exactly as stated.
- Infer servings (cookie/roll/bar count when given) and prep/cook minutes only when reasonably
  supported; otherwise 0.
- ESTIMATE caloriesPerServing (kcal) from ingredient amounts, and priceUah — ingredient cost PER
  SERVING in Ukrainian hryvnia at Ukrainian supermarket prices.
- A few lowercase ENGLISH tags (meal type, diet, method). Ignore links/hashtags/sponsor text.`;

const client = new Anthropic({ apiKey: ANTHROPIC_KEY, maxRetries: 5 });
let totalIn = 0;
let totalOut = 0;

async function extract(video) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 12000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Extract the cooking recipe.\n\nVIDEO TITLE:\n${video.title}\n\nDESCRIPTION:\n${video.description}`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });
  totalIn += res.usage?.input_tokens ?? 0;
  totalOut += res.usage?.output_tokens ?? 0;
  if (res.stop_reason === "refusal") throw new Error("refused");
  const text = res.content.find((b) => b.type === "text")?.text;
  return JSON.parse(text);
}

// ---------- normalise to the app's Recipe shape ----------
const cleanL = (l) => {
  const en = (l?.en ?? "").trim();
  const uk = (l?.uk ?? "").trim();
  return en || uk ? { en: en || uk, uk: uk || en } : undefined;
};
const pos = (n) => (typeof n === "number" && n > 0 ? Math.round(n) : undefined);

function slugify(s) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `recipe-${Date.now().toString(36)}`
  );
}

function toRecipe(raw, video, author, takenIds) {
  const title = cleanL(raw.title) ?? { en: video.title, uk: video.title };
  let id = slugify(title.en);
  let n = 2;
  while (takenIds.has(id)) id = `${slugify(title.en)}-${n++}`;
  takenIds.add(id);

  const recipe = {
    id,
    title,
    description: cleanL(raw.description),
    servings: pos(raw.servings),
    prepMinutes: pos(raw.prepMinutes),
    cookMinutes: pos(raw.cookMinutes),
    cuisine: cleanL(raw.cuisine),
    difficulty: ["easy", "medium", "hard"].includes(raw.difficulty) ? raw.difficulty : undefined,
    tags: (raw.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    ingredients: (raw.ingredients ?? [])
      .map((i) => {
        const name = cleanL(i.name);
        if (!name) return null;
        const out = { name };
        if (typeof i.quantity === "number" && i.quantity > 0) out.quantity = i.quantity;
        const unit = cleanL(i.unit);
        if (unit) out.unit = unit;
        const note = cleanL(i.note);
        if (note) out.note = note;
        return out;
      })
      .filter(Boolean),
    steps: (raw.steps ?? []).map(cleanL).filter(Boolean),
    caloriesPerServing: pos(raw.caloriesPerServing),
    priceUah: pos(raw.priceUah),
    image: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    source: { type: "youtube", url: `https://www.youtube.com/watch?v=${video.id}`, videoId: video.id, author },
    createdAt: Date.parse(video.publishedAt),
  };

  // sanity checks
  if (!recipe.ingredients.length || !recipe.steps.length) throw new Error("empty ingredients/steps");
  const badUnit = recipe.ingredients.find((i) => i.unit && /cup|oz|lb|stick/i.test(i.unit.en));
  if (badUnit) throw new Error(`non-metric unit leaked: ${badUnit.unit.en}`);
  return recipe;
}

// ---------- main ----------
console.log(`Channel: @${handle} · model: ${MODEL}`);
const { author, videos, total } = await listRecipeVideos();
console.log(`Uploads: ${total} · with recipes: ${videos.length}`);

const existing = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, "utf8")) : [];
const doneVideoIds = new Set(existing.map((r) => r.source?.videoId).filter(Boolean));
for (const m of fs.readFileSync(IMPORTED_TS, "utf8").matchAll(/videoId:\s*"([^"]+)"/g)) doneVideoIds.add(m[1]);
const takenIds = new Set(existing.map((r) => r.id));
for (const m of fs.readFileSync(IMPORTED_TS, "utf8").matchAll(/id:\s*"([^"]+)"/g)) takenIds.add(m[1]);

const todo = videos.filter((v) => !doneVideoIds.has(v.id)).slice(0, LIMIT);
console.log(`Already imported: ${doneVideoIds.size} · to import now: ${todo.length}\n`);

const results = [];
const failures = [];
let cursor = 0;
async function worker() {
  while (cursor < todo.length) {
    const video = todo[cursor++];
    const label = `[${cursor}/${todo.length}] ${video.title.slice(0, 60)}`;
    try {
      const raw = await extract(video);
      const recipe = toRecipe(raw, video, author, takenIds);
      results.push(recipe);
      console.log(`✅ ${label}`);
    } catch (e) {
      failures.push({ id: video.id, title: video.title, error: String(e.message ?? e) });
      console.log(`❌ ${label} — ${e.message ?? e}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const merged = [...existing, ...results].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 1) + "\n");

const PRICES = {
  "claude-haiku-4-5": [1, 5],
  "claude-sonnet-5": [3, 15],
  "claude-opus-4-8": [5, 25],
  "claude-fable-5": [10, 50],
};
const [pin, pout] = PRICES[MODEL] ?? [0, 0];
const cost = (totalIn / 1e6) * pin + (totalOut / 1e6) * pout;
console.log(`\nImported ${results.length} recipes → ${path.relative(ROOT, OUT_FILE)} (${merged.length} total)`);
if (failures.length) console.log(`Failed ${failures.length}:`, failures.map((f) => f.title).join(" | "));
console.log(`Tokens: ${totalIn.toLocaleString()} in / ${totalOut.toLocaleString()} out ≈ $${cost.toFixed(2)}`);
console.log(`\nNext: pnpm typecheck && pnpm build, then commit & push to deploy.`);
