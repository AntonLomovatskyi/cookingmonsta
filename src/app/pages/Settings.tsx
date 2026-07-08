import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { exportData, importDataFromFile } from "@/data/backup";
import { firebaseEnabled } from "@/lib/firebase";
import { pullNow, pushNow, signInWithGoogle, signOutNow, useAuthStore } from "@/lib/sync";
import { AI_MODELS, useUserStore, type AiModel } from "@/store/userStore";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 font-bold text-flame">{title}</div>
      {children}
    </div>
  );
}

function KeyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-xl border border-border bg-surface-alt py-2.5 pl-9 pr-10 text-text outline-none placeholder:text-text-faint focus:border-flame"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-faint hover:text-flame"
        aria-label={show ? "Hide" : "Show"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function SyncCard() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const statusLabel =
    status === "syncing"
      ? "Syncing…"
      : status === "saved"
        ? "Saved to cloud ✓"
        : status === "error"
          ? "Sync error"
          : "";

  if (!firebaseEnabled) {
    return (
      <Card title="Sync">
        <div className="text-sm text-text-dim">
          Cloud sync isn't configured for this build. Your data lives on this device — use the backup below to move it.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Sync">
      {user ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-text">
            Signed in as <span className="text-flame">{user.displayName ?? user.email}</span>
          </div>
          {statusLabel && <div className="text-xs text-text-faint">{statusLabel}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pushNow()}
              className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
            >
              Save to cloud
            </button>
            <button
              type="button"
              onClick={() => pullNow()}
              className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
            >
              Load
            </button>
          </div>
          <button
            type="button"
            onClick={() => signOutNow()}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-text-dim">Sign in to sync your recipes, favourites & notes across devices.</div>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="rounded-xl bg-flame px-4 py-3 text-center font-bold text-bg"
          >
            Sign in with Google
          </button>
        </div>
      )}
    </Card>
  );
}

export default function Settings() {
  const theme = useUserStore((s) => s.theme);
  const setTheme = useUserStore((s) => s.setTheme);
  const aiModel = useUserStore((s) => s.aiModel);
  const setAiModel = useUserStore((s) => s.setAiModel);
  const anthropicKey = useUserStore((s) => s.anthropicKey);
  const setAnthropicKey = useUserStore((s) => s.setAnthropicKey);
  const youtubeKey = useUserStore((s) => s.youtubeKey);
  const setYoutubeKey = useUserStore((s) => s.setYoutubeKey);
  const favourites = useUserStore((s) => s.favourites);
  const cooked = useUserStore((s) => s.cooked);
  const userRecipes = useUserStore((s) => s.userRecipes);
  const clearFavourites = useUserStore((s) => s.clearFavourites);
  const clearCooked = useUserStore((s) => s.clearCooked);

  const onImport = async () => {
    const r = await importDataFromFile();
    window.alert(r.message);
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <Card title="AI import">
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1.5 text-sm text-text-dim">Anthropic API key</div>
            <KeyInput value={anthropicKey} onChange={setAnthropicKey} placeholder="sk-ant-…" />
            <p className="mt-1.5 text-xs text-text-faint">
              Stored only in this browser — never bundled into the site or synced. Get one at{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-flame underline">
                console.anthropic.com
              </a>
              .
            </p>
          </div>

          <div>
            <div className="mb-1.5 text-sm text-text-dim">Extraction model</div>
            <div className="grid grid-cols-2 gap-2">
              {AI_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiModel(m.id as AiModel)}
                  className={clsx(
                    "rounded-xl border px-3 py-2 text-left transition",
                    aiModel === m.id
                      ? "border-flame bg-flame/15"
                      : "border-border bg-surface-alt hover:border-flame/60",
                  )}
                >
                  <div className="text-sm font-semibold text-text">{m.label}</div>
                  <div className="text-[11px] text-text-faint">{m.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-sm text-text-dim">
              YouTube Data API key <span className="text-text-faint">(optional)</span>
            </div>
            <KeyInput value={youtubeKey} onChange={setYoutubeKey} placeholder="AIza…" />
            <p className="mt-1.5 text-xs text-text-faint">
              Lets the app fetch a video's description &amp; comments automatically. Without it, you paste the
              description yourself.
            </p>
          </div>
        </div>
      </Card>

      <SyncCard />

      <Card title="Appearance">
        <div className="mb-1.5 text-sm text-text-dim">Theme</div>
        <div className="flex gap-2">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={clsx(
                "flex-1 rounded-full border px-3 py-1.5 text-sm capitalize transition",
                theme === t ? "border-flame bg-flame/15 text-text" : "border-border bg-surface-alt text-text-dim",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Sections">
        <Link to="/recipe/new" className="block rounded-xl border border-border bg-surface-alt px-4 py-3 text-text">
          ＋ Add a recipe by hand
        </Link>
      </Card>

      <Card title="Backup">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => exportData(Date.now())}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
          >
            ⬆️ Export data
          </button>
          <button
            type="button"
            onClick={onImport}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
          >
            ⬇️ Import data
          </button>
        </div>
      </Card>

      <Card title="Data">
        <div className="mb-3 flex justify-between text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-text">{userRecipes.length}</div>
            <div className="text-text-dim">Recipes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-text">{favourites.length}</div>
            <div className="text-text-dim">Saved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-text">{cooked.length}</div>
            <div className="text-text-dim">Cooked</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.confirm("Clear your cook log?") && clearCooked()}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            Clear cook log
          </button>
          <button
            type="button"
            onClick={() => window.confirm("Clear all favourites?") && clearFavourites()}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            Clear favourites
          </button>
        </div>
      </Card>

      <div className="pb-2 text-center text-xs text-text-faint">cookingmonsta 🍳</div>
    </div>
  );
}
