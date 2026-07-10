/**
 * Cross-device sync via Firebase: Google sign-in + a single Firestore doc per user
 * (users/{uid}) holding the PersistedData JSON. On login we pull the cloud copy into the
 * store; local changes auto-push (debounced). All no-ops when Firebase isn't configured.
 */
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { create } from "zustand";
import { getCloudSnapshot } from "@/data/backup";
import { useUserStore, type PersistedData } from "@/store/userStore";
import { auth, db, firebaseEnabled, googleProvider } from "./firebase";

export type SyncStatus = "idle" | "syncing" | "saved" | "error";

interface AuthState {
  user: User | null;
  status: SyncStatus;
  /** Raw message of the last sync failure — shown in Settings so errors are diagnosable. */
  errorDetail: string | null;
  set: (p: Partial<Pick<AuthState, "user" | "status" | "errorDetail">>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  errorDetail: null,
  set: (p) => set(p),
}));

const setStatus = (status: SyncStatus) => useAuthStore.getState().set({ status, errorDetail: null });

const setError = (scope: string, e: unknown) => {
  const detail = e instanceof Error ? e.message : String(e);
  console.error(`[sync] ${scope} failed:`, e);
  useAuthStore.getState().set({ status: "error", errorDetail: detail });
};

let suppressPush = false; // don't echo a freshly-pulled snapshot back up
let pushTimer: ReturnType<typeof setTimeout> | undefined;

export async function pushNow(uid?: string): Promise<void> {
  const u = uid ?? useAuthStore.getState().user?.uid;
  if (!db || !u) return;
  try {
    setStatus("syncing");
    // JSON round-trip strips `undefined` field values, which Firestore rejects (recipes imported
    // in the current session can carry explicit undefined optional fields).
    const data = JSON.parse(JSON.stringify(getCloudSnapshot())) as PersistedData;
    await setDoc(doc(db, "users", u), { data, updatedAt: Date.now() });
    setStatus("saved");
  } catch (e) {
    setError("push", e);
  }
}

export async function pullNow(uid?: string): Promise<void> {
  const u = uid ?? useAuthStore.getState().user?.uid;
  if (!db || !u) return;
  try {
    setStatus("syncing");
    const snap = await getDoc(doc(db, "users", u));
    if (snap.exists()) {
      const data = snap.data().data as Partial<PersistedData> | undefined;
      if (data) {
        suppressPush = true;
        useUserStore.getState().importData(data);
        suppressPush = false;
      }
    } else {
      await pushNow(u); // first login on this account: seed the cloud with local data
      return; // pushNow already set the final status (or the error detail)
    }
    setStatus("saved");
  } catch (e) {
    setError("pull", e);
  }
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) return;
  await signInWithPopup(auth, googleProvider);
}

export async function signOutNow(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

let started = false;
/** Wire the auth listener + debounced auto-push. Call once at app start. */
export function initSync(): void {
  if (started || !firebaseEnabled || !auth) return;
  started = true;

  onAuthStateChanged(auth, (user) => {
    useAuthStore.getState().set({ user });
    if (user) void pullNow(user.uid);
    else setStatus("idle");
  });

  useUserStore.subscribe(() => {
    if (suppressPush) return;
    const u = useAuthStore.getState().user;
    if (!u) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => void pushNow(u.uid), 1500);
  });
}
