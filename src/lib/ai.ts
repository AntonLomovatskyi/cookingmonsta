/**
 * Recipe extraction with Claude, called directly from the browser with the user's own API key
 * (Settings → stored in localStorage, never bundled or synced). The model is user-selectable
 * (default Haiku 4.5 — cheap & fast; extraction is a simple structured task). Structured Outputs
 * (`output_config.format`) guarantees the response is JSON matching our schema.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { AiModel } from "@/store/userStore";
import type { Difficulty, Ingredient } from "@/types/recipe";

/** The shape the model returns — everything required so Structured Outputs stays simple. Unknowns
 * are 0 / "" and normalised away afterwards. */
const RECIPE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "The name of the dish." },
    description: { type: "string", description: "One or two sentence summary. Empty string if none." },
    servings: { type: "integer", description: "Number of servings. 0 if unknown." },
    prepMinutes: { type: "integer", description: "Prep time in minutes. 0 if unknown." },
    cookMinutes: { type: "integer", description: "Cook time in minutes. 0 if unknown." },
    cuisine: { type: "string", description: "Cuisine, e.g. Italian. Empty string if unclear." },
    difficulty: { type: "string", enum: ["easy", "medium", "hard", ""], description: "'' if unclear." },
    tags: { type: "array", items: { type: "string" }, description: "Lowercase tags: meal, diet, method, mood." },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          quantity: { type: "number", description: "Numeric amount, 0 if none/to-taste." },
          unit: { type: "string", description: "e.g. g, ml, tbsp, clove. Empty if none." },
          note: { type: "string", description: "e.g. 'finely chopped', 'to taste'. Empty if none." },
        },
        required: ["name", "quantity", "unit", "note"],
      },
    },
    steps: { type: "array", items: { type: "string" }, description: "Ordered preparation steps." },
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
  ],
} as const;

const SYSTEM = `You extract a single cooking recipe from messy source text (a YouTube video's title,
description and comments, or pasted notes). Return the recipe as structured data.

Guidelines:
- Keep the recipe in the SAME LANGUAGE as the source content.
- Pull ingredients with amounts and units where stated. Split combined lines into separate items.
- Write clear, ordered, imperative preparation steps. Merge duplicated info from description + comments.
- Infer servings and prep/cook times only when reasonably supported; otherwise use 0.
- Add a few useful lowercase tags (meal type, diet, method, cuisine feel).
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
  title: string;
  description?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  cuisine?: string;
  difficulty?: Difficulty;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
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

interface RawIngredient {
  name?: string;
  quantity?: number;
  unit?: string;
  note?: string;
}

interface RawRecipe {
  title?: string;
  description?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  cuisine?: string;
  difficulty?: string;
  tags?: string[];
  ingredients?: RawIngredient[];
  steps?: string[];
}

function clean(raw: RawRecipe): ExtractedRecipe {
  const posInt = (n?: number) => (typeof n === "number" && n > 0 ? Math.round(n) : undefined);
  const str = (s?: string) => (s && s.trim() ? s.trim() : undefined);
  const difficulty = raw.difficulty && ["easy", "medium", "hard"].includes(raw.difficulty)
    ? (raw.difficulty as Difficulty)
    : undefined;

  const ingredients: Ingredient[] = (raw.ingredients ?? [])
    .filter((i) => i.name && i.name.trim())
    .map((i) => {
      const out: Ingredient = { name: i.name!.trim() };
      if (typeof i.quantity === "number" && i.quantity > 0) out.quantity = i.quantity;
      const u = str(i.unit);
      if (u) out.unit = u;
      const n = str(i.note);
      if (n) out.note = n;
      return out;
    });

  return {
    title: str(raw.title) ?? "Untitled recipe",
    description: str(raw.description),
    servings: posInt(raw.servings),
    prepMinutes: typeof raw.prepMinutes === "number" && raw.prepMinutes > 0 ? Math.round(raw.prepMinutes) : undefined,
    cookMinutes: typeof raw.cookMinutes === "number" && raw.cookMinutes > 0 ? Math.round(raw.cookMinutes) : undefined,
    cuisine: str(raw.cuisine),
    difficulty,
    tags: (raw.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    ingredients,
    steps: (raw.steps ?? []).map((s) => s.trim()).filter(Boolean),
  };
}

export async function extractRecipe(
  input: ExtractInput,
  apiKey: string,
  model: AiModel,
): Promise<ExtractedRecipe> {
  if (!apiKey) throw new Error("Add your Anthropic API key in Settings first.");

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  // output_config / model strings may be newer than the installed SDK types — cast the request.
  const body = {
    model,
    max_tokens: 8000,
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
