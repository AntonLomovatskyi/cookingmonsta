/**
 * Snapshot / export / import of the synced user-data subset.
 *
 * Two snapshot flavours:
 * - `getSnapshot()`      → backup FILE export — excludes the Anthropic key so a shared backup
 *                          never leaks it.
 * - `getCloudSnapshot()` → Firestore sync — includes the Anthropic key, so signing in with the
 *                          same Google account on another device brings the key along. The
 *                          users/{uid} doc is readable only by the signed-in owner (rules).
 */
import { useUserStore, type PersistedData } from "@/store/userStore";

export function getSnapshot(): PersistedData {
  const s = useUserStore.getState();
  return {
    favourites: s.favourites,
    notes: s.notes,
    cooked: s.cooked,
    shopping: s.shopping,
    boughtItems: s.boughtItems,
    plan: s.plan,
    userRecipes: s.userRecipes,
    recentlyViewed: s.recentlyViewed,
    theme: s.theme,
    language: s.language,
  };
}

export function getCloudSnapshot(): PersistedData {
  return { ...getSnapshot(), anthropicKey: useUserStore.getState().anthropicKey };
}

export function exportData(at: number): void {
  const blob = new Blob([JSON.stringify(getSnapshot(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cookingmonsta-backup-${new Date(at).toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importDataFromFile(): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve({ ok: false, message: "No file selected." });
      try {
        const data = JSON.parse(await file.text()) as Partial<PersistedData>;
        useUserStore.getState().importData(data);
        resolve({ ok: true, message: "Backup imported." });
      } catch {
        resolve({ ok: false, message: "Could not read that file." });
      }
    };
    input.click();
  });
}
