import { AlertCircle, Loader2, Sparkles, Youtube } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { extractRecipe } from "@/lib/ai";
import { fetchYouTube, parseVideoId } from "@/lib/youtube";
import { slugify } from "@/data/recipes";
import { AI_MODELS, useUserStore } from "@/store/userStore";
import { useDraftStore } from "@/store/draftStore";
import type { Recipe } from "@/types/recipe";

type Phase = "idle" | "fetching" | "extracting" | "error";

export default function Import() {
  const nav = useNavigate();
  const anthropicKey = useUserStore((s) => s.anthropicKey);
  const youtubeKey = useUserStore((s) => s.youtubeKey);
  const aiModel = useUserStore((s) => s.aiModel);
  const setDraft = useDraftStore((s) => s.setDraft);

  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);

  const modelLabel = AI_MODELS.find((m) => m.id === aiModel)?.label ?? aiModel;
  const busy = phase === "fetching" || phase === "extracting";

  const run = async () => {
    setError("");
    if (!anthropicKey) {
      setError("Add your Anthropic API key in Settings to enable extraction.");
      setPhase("error");
      return;
    }
    const trimmed = url.trim();
    const isYouTube = !!parseVideoId(trimmed);

    try {
      let title: string | undefined;
      let author: string | undefined;
      let description: string | undefined;
      let comments: string[] = [];
      let thumbnail: string | undefined;
      let videoId: string | undefined;

      if (isYouTube) {
        setPhase("fetching");
        const yt = await fetchYouTube(trimmed, youtubeKey || undefined);
        title = yt.title;
        author = yt.author;
        description = yt.description;
        comments = yt.comments;
        thumbnail = yt.thumbnail;
        videoId = yt.videoId;
        setFetchedTitle(yt.title ?? null);

        // No description available (no Data API key) and nothing pasted → ask the user to paste.
        if (!yt.usedDataApi && !pasted.trim()) {
          setPhase("idle");
          setError(
            "Fetched the video title, but I need the recipe text. Paste the video description below, or add a YouTube Data API key in Settings to fetch it automatically.",
          );
          return;
        }
      } else if (!trimmed && !pasted.trim()) {
        setError("Paste a YouTube link or some recipe text to get started.");
        setPhase("error");
        return;
      }

      setPhase("extracting");
      const extracted = await extractRecipe(
        { title, author, description, comments, extraText: pasted },
        anthropicKey,
        aiModel,
      );

      const id = slugify(extracted.title);
      const recipe: Recipe = {
        ...extracted,
        id,
        image: thumbnail,
        createdAt: Date.now(),
        source: isYouTube
          ? { type: "youtube", url: trimmed, videoId, author }
          : { type: "import" },
      };

      setDraft(recipe);
      setPhase("idle");
      nav("/recipe/new?from=import");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-flame/15 p-2 text-flame">
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Import a recipe</h1>
          <p className="text-sm text-text-dim">Paste a cooking video — extraction by {modelLabel}.</p>
        </div>
      </div>

      {/* URL input */}
      <div className="mt-5">
        <label className="text-sm font-bold text-flame">YouTube link</label>
        <div className="relative mt-2">
          <Youtube size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-danger" />
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setFetchedTitle(null);
            }}
            placeholder="https://youtube.com/watch?v=…"
            inputMode="url"
            className="w-full rounded-xl border border-border bg-surface-alt py-3 pl-10 pr-3 text-text outline-none placeholder:text-text-faint focus:border-flame"
          />
        </div>
        {fetchedTitle && <div className="mt-2 text-sm text-text-dim">🎬 {fetchedTitle}</div>}
      </div>

      {/* Paste fallback */}
      <div className="mt-4">
        <label className="text-sm font-bold text-flame">
          Recipe text <span className="font-normal text-text-faint">(optional / fallback)</span>
        </label>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Paste the video description or any recipe text here. Handy when you haven't set a YouTube Data API key — or to import from anywhere, not just YouTube."
          rows={5}
          className="mt-2 w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-faint focus:border-flame"
        />
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            {error}
            {error.includes("Settings") && (
              <>
                {" "}
                <Link to="/settings" className="underline">
                  Open Settings
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={run}
        disabled={busy}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-flame px-4 py-3 font-bold text-bg disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {phase === "fetching" ? "Fetching video…" : "Extracting recipe…"}
          </>
        ) : (
          <>
            <Sparkles size={18} /> Extract recipe
          </>
        )}
      </button>

      {!anthropicKey && (
        <p className="mt-3 text-center text-xs text-text-faint">
          You'll need an Anthropic API key.{" "}
          <Link to="/settings" className="text-flame underline">
            Add it in Settings
          </Link>
          .
        </p>
      )}

      <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm text-text-dim">
        <div className="mb-1 font-semibold text-text">How it works</div>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Paste a YouTube cooking video link.</li>
          <li>
            With a YouTube Data API key set, the description &amp; top comments are fetched
            automatically. Without one, paste the description into the box above.
          </li>
          <li>Claude ({modelLabel}) reads it and structures the ingredients &amp; steps.</li>
          <li>You review &amp; tweak, then save it to your collection.</li>
        </ol>
      </div>
    </div>
  );
}
