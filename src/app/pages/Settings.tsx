import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { exportData, importDataFromFile } from "@/data/backup";
import { useT } from "@/i18n";
import { firebaseEnabled } from "@/lib/firebase";
import { pullNow, pushNow, signInWithGoogle, signOutNow, useAuthStore } from "@/lib/sync";
import { AI_MODELS, useUserStore, type AiModel } from "@/store/userStore";
import type { Lang } from "@/types/recipe";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 font-bold text-flame">{title}</div>
      {children}
    </div>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex-1 rounded-full border px-3 py-1.5 text-sm transition",
            value === o.value
              ? "border-flame bg-flame/15 text-text"
              : "border-border bg-surface-alt text-text-dim hover:border-flame/60",
          )}
        >
          {o.label}
        </button>
      ))}
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
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const statusLabel =
    status === "syncing"
      ? t.settings.syncing
      : status === "saved"
        ? t.settings.savedCloud
        : status === "error"
          ? t.settings.syncErr
          : "";

  if (!firebaseEnabled) {
    return (
      <Card title={t.settings.sync}>
        <div className="text-sm text-text-dim">{t.settings.syncOff}</div>
      </Card>
    );
  }

  return (
    <Card title={t.settings.sync}>
      {user ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-text">
            {t.settings.signedInAs} <span className="text-flame">{user.displayName ?? user.email}</span>
          </div>
          {statusLabel && <div className="text-xs text-text-faint">{statusLabel}</div>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pushNow()}
              className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
            >
              {t.settings.saveCloud}
            </button>
            <button
              type="button"
              onClick={() => pullNow()}
              className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
            >
              {t.settings.load}
            </button>
          </div>
          <button
            type="button"
            onClick={() => signOutNow()}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            {t.settings.signOut}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-text-dim">{t.settings.signInNote}</div>
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="rounded-xl bg-flame px-4 py-3 text-center font-bold text-bg"
          >
            {t.settings.signIn}
          </button>
        </div>
      )}
    </Card>
  );
}

export default function Settings() {
  const t = useT();
  const theme = useUserStore((s) => s.theme);
  const setTheme = useUserStore((s) => s.setTheme);
  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
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
      <Card title={t.settings.aiImport}>
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1.5 text-sm text-text-dim">{t.settings.anthropicKey}</div>
            <KeyInput value={anthropicKey} onChange={setAnthropicKey} placeholder="sk-ant-…" />
            <p className="mt-1.5 text-xs text-text-faint">
              {t.settings.keyNote}{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-flame underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          <div>
            <div className="mb-1.5 text-sm text-text-dim">{t.settings.model}</div>
            <div className="grid grid-cols-2 gap-2">
              {AI_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiModel(m.id as AiModel)}
                  className={clsx(
                    "rounded-xl border px-3 py-2 text-left transition",
                    aiModel === m.id ? "border-flame bg-flame/15" : "border-border bg-surface-alt hover:border-flame/60",
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
              {t.settings.ytKey} <span className="text-text-faint">{t.settings.ytOptional}</span>
            </div>
            <KeyInput value={youtubeKey} onChange={setYoutubeKey} placeholder="AIza…" />
            <p className="mt-1.5 text-xs text-text-faint">{t.settings.ytNote}</p>
          </div>
        </div>
      </Card>

      <SyncCard />

      <Card title={t.settings.appearance}>
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-sm text-text-dim">{t.settings.language}</div>
            <Seg<Lang>
              value={language}
              onChange={setLanguage}
              options={[
                { value: "uk", label: "Українська" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
          <div>
            <div className="mb-1.5 text-sm text-text-dim">{t.settings.theme}</div>
            <Seg<"dark" | "light">
              value={theme}
              onChange={setTheme}
              options={[
                { value: "dark", label: t.settings.dark },
                { value: "light", label: t.settings.light },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card title={t.settings.sections}>
        <Link to="/recipe/new" className="block rounded-xl border border-border bg-surface-alt px-4 py-3 text-text">
          {t.settings.addByHand}
        </Link>
      </Card>

      <Card title={t.settings.backup}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => exportData(Date.now())}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
          >
            {t.settings.exportData}
          </button>
          <button
            type="button"
            onClick={onImport}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-text"
          >
            {t.settings.importData}
          </button>
        </div>
      </Card>

      <Card title={t.settings.data}>
        <div className="mb-3 flex justify-between text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-text">{userRecipes.length}</div>
            <div className="text-text-dim">{t.settings.recipes}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-text">{favourites.length}</div>
            <div className="text-text-dim">{t.settings.saved}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-text">{cooked.length}</div>
            <div className="text-text-dim">{t.settings.cooked}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.confirm(t.settings.clearCookedConfirm) && clearCooked()}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            {t.settings.clearCooked}
          </button>
          <button
            type="button"
            onClick={() => window.confirm(t.settings.clearFavsConfirm) && clearFavourites()}
            className="rounded-xl border border-border bg-surface-alt px-4 py-3 text-danger"
          >
            {t.settings.clearFavs}
          </button>
        </div>
      </Card>

      <div className="pb-2 text-center text-xs text-text-faint">cookingmonsta 🍳</div>
    </div>
  );
}
