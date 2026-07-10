/**
 * Recipe extraction with Claude, called directly from the browser with the user's own API key
 * (Settings → stored in localStorage, never bundled or synced). The model is user-selectable
 * (default Haiku 4.5 — cheap & fast). Structured Outputs (`output_config.format`) guarantees the
 * response is JSON matching our schema.
 *
 * Output contract: BILINGUAL (every text field as {en, uk}), METRIC UNITS ONLY (g/ml/tbsp/tsp/
 * counts — cups, oz, lb, sticks are converted), plus per-serving calorie and ₴-price estimates.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Difficulty, Ingredient, L10n } from "@/types/recipe";

/** Extraction always runs on the cheapest model — plenty for structured recipe extraction. */
export const EXTRACTION_MODEL = { id: "claude-haiku-4-5", label: "Haiku 4.5" } as const;

const L10N_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    en: { type: "string", description: "English text." },
    uk: { type: "string", description: "Ukrainian text." },
  },
  required: ["en", "uk"],
} as const;

/** Everything required so Structured Outputs stays simple; unknowns are 0 / "" and normalised away. */
const RECIPE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { ...L10N_SCHEMA, description: "The name of the dish, in both languages." },
    description: { ...L10N_SCHEMA, description: "One or two sentence summary. Empty strings if none." },
    servings: { type: "integer", description: "Number of servings. 0 if unknown." },
    prepMinutes: { type: "integer", description: "Prep time in minutes. 0 if unknown." },
    cookMinutes: { type: "integer", description: "Cook time in minutes. 0 if unknown." },
    cuisine: { ...L10N_SCHEMA, description: "Cuisine, e.g. Italian/Італійська. Empty strings if unclear." },
    difficulty: { type: "string", enum: ["easy", "medium", "hard", ""], description: "'' if unclear." },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Lowercase ENGLISH tag slugs: meal, diet, method, mood.",
    },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: L10N_SCHEMA,
          quantity: { type: "number", description: "Numeric amount, 0 if none/to-taste." },
          unit: {
            ...L10N_SCHEMA,
            description:
              "METRIC OR SPOONS OR COUNT ONLY: g/г, ml/мл, tbsp/ст. л., tsp/ч. л., clove/зубчик, etc. NEVER cups, oz, lb or sticks — convert them. Empty strings for plain counts.",
          },
          note: { ...L10N_SCHEMA, description: "e.g. 'finely chopped', 'to taste'. Empty strings if none." },
        },
        required: ["name", "quantity", "unit", "note"],
      },
    },
    steps: {
      type: "array",
      items: L10N_SCHEMA,
      description: "Ordered preparation steps, each in both languages.",
    },
    caloriesPerServing: {
      type: "integer",
      description: "Estimated kcal per serving, from the ingredient amounts. 0 only if truly impossible.",
    },
    priceUah: {
      type: "integer",
      description:
        "Estimated ingredient cost PER SERVING in Ukrainian hryvnia (₴), assuming Ukrainian supermarket prices. 0 only if truly impossible.",
    },
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
} as const;

const SYSTEM = `You extract a single cooking recipe from messy source text (a YouTube video's title,
description and comments, or pasted notes). Return the recipe as structured data.

Rules:
- BILINGUAL: produce EVERY text field in BOTH English (en) and Ukrainian (uk). Translate whichever
  language the source lacks — natural, idiomatic cooking language, not word-for-word.
- UNITS: metric or spoons or counts ONLY — grams (g/г), millilitres (ml/мл), tablespoons
  (tbsp/ст. л.), teaspoons (tsp/ч. л.), or countable pieces (eggs, cloves/зубчики). NEVER cups,
  ounces, pounds or sticks: convert them using ingredient-appropriate densities (e.g. 1 cup flour
  ≈ 125 g, 1 cup sugar ≈ 200 g, 1 cup butter ≈ 227 g, 1 cup liquid = 240 ml, 1 stick butter = 113 g,
  1 oz = 28 g). When the source already gives grams alongside cups, use the gram value.
- Pull ingredients with amounts where stated. Split combined lines into separate items.
- Write clear, ordered, imperative preparation steps. Merge duplicated info from description + comments.
- Infer servings and prep/cook times only when reasonably supported; otherwise use 0.
- ESTIMATE caloriesPerServing (kcal) from the ingredient amounts, and priceUah — the approximate
  ingredient cost per serving in Ukrainian hryvnia at Ukrainian supermarket prices. Round sensibly.
- Add a few useful lowercase ENGLISH tags (meal type, diet, method, cuisine feel).
- Ignore sponsorships, links, hashtags, subscribe pleas and unrelated chatter.
- If the content clearly is not a recipe, still return your best-effort structured guess with an
  honest title; never invent an elaborate fake recipe.`;

export interface ExtractInput {
  title?: string;
  author?: string;
  description?: string;
  comments?: string[];
  /** Anything the user pasted by hand (used when there's no Data API description). */
  extraText?: string;
}

export interface ExtractedRecipe {
  title: L10n;
  description?: L10n;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  cuisine?: L10n;
  difficulty?: Difficulty;
  tags: string[];
  ingredients: Ingredient[];
  steps: L10n[];
  caloriesPerServing?: number;
  priceUah?: number;
}

function buildUserContent(input: ExtractInput): string {
  const parts: string[] = [];
  if (input.title) parts.push(`VIDEO TITLE:\n${input.title}`);
  if (input.author) parts.push(`CHANNEL:\n${input.author}`);
  if (input.description?.trim()) parts.push(`DESCRIPTION:\n${input.description.trim()}`);
  if (input.extraText?.trim()) parts.push(`PASTED NOTES:\n${input.extraText.trim()}`);
  if (input.comments?.length) {
    parts.push(`TOP COMMENTS (may contain the recipe or corrections):\n${input.comments.slice(0, 25).join("\n---\n")}`);
  }
  return `Extract the cooking recipe from the following content.\n\n${parts.join("\n\n")}`;
}

interface ClaudeResponse {
  stop_reason?: string;
  content?: { type: string; text?: string }[];
}

interface RawL10n {
  en?: string;
  uk?: string;
}

interface RawIngredient {
  name?: RawL10n;
  quantity?: number;
  unit?: RawL10n;
  note?: RawL10n;
}

interface RawRecipe {
  title?: RawL10n;
  description?: RawL10n;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  cuisine?: RawL10n;
  difficulty?: string;
  tags?: string[];
  ingredients?: RawIngredient[];
  steps?: RawL10n[];
  caloriesPerServing?: number;
  priceUah?: number;
}

function cleanL(raw?: RawL10n): L10n | undefined {
  const en = raw?.en?.trim() ?? "";
  const uk = raw?.uk?.trim() ?? "";
  if (!en && !uk) return undefined;
  return { en: en || uk, uk: uk || en };
}

function clean(raw: RawRecipe): ExtractedRecipe {
  const posNum = (n?: number) => (typeof n === "number" && n > 0 ? Math.round(n) : undefined);
  const difficulty =
    raw.difficulty && ["easy", "medium", "hard"].includes(raw.difficulty) ? (raw.difficulty as Difficulty) : undefined;

  const ingredients: Ingredient[] = (raw.ingredients ?? [])
    .map((i) => {
      const name = cleanL(i.name);
      if (!name) return null;
      const out: Ingredient = { name };
      if (typeof i.quantity === "number" && i.quantity > 0) out.quantity = i.quantity;
      const unit = cleanL(i.unit);
      if (unit) out.unit = unit;
      const note = cleanL(i.note);
      if (note) out.note = note;
      return out;
    })
    .filter((i): i is Ingredient => !!i);

  return {
    title: cleanL(raw.title) ?? { en: "Untitled recipe", uk: "Рецепт без назви" },
    description: cleanL(raw.description),
    servings: posNum(raw.servings),
    prepMinutes: posNum(raw.prepMinutes),
    cookMinutes: posNum(raw.cookMinutes),
    cuisine: cleanL(raw.cuisine),
    difficulty,
    tags: (raw.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    ingredients,
    steps: (raw.steps ?? []).map(cleanL).filter((s): s is L10n => !!s),
    caloriesPerServing: posNum(raw.caloriesPerServing),
    priceUah: posNum(raw.priceUah),
  };
}

export async function extractRecipe(input: ExtractInput, apiKey: string): Promise<ExtractedRecipe> {
  if (!apiKey) throw new Error("Add your Anthropic API key in Settings first.");

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  // output_config / model strings may be newer than the installed SDK types — cast the request.
  const body = {
    model: EXTRACTION_MODEL.id,
    max_tokens: 12000,
    system: SYSTEM,
    messages: [{ role: "user", content: buildUserContent(input) }],
    output_config: { format: { type: "json_schema", schema: RECIPE_JSON_SCHEMA } },
  };

  let res: ClaudeResponse;
  try {
    res = (await client.messages.create(body as never)) as unknown as ClaudeResponse;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/401|invalid x-api-key|authentication/i.test(msg)) {
      throw new Error("That Anthropic API key was rejected. Check it in Settings.");
    }
    throw new Error(`Extraction failed: ${msg}`);
  }

  if (res.stop_reason === "refusal") {
    throw new Error("The model declined to process this content. Try a different video or paste the recipe text.");
  }

  const text = res.content?.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("The model returned an empty response — try again.");

  let parsed: RawRecipe;
  try {
    parsed = JSON.parse(text) as RawRecipe;
  } catch {
    throw new Error("Could not parse the model's response as a recipe.");
  }
  return clean(parsed);
}
