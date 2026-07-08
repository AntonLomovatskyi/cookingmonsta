# Cross-device sync (Firebase) — setup

The app syncs your data (recipes, favourites, notes, cook log, prefs) across devices via **Firebase
Auth (Google) + Firestore**. The free **Spark** plan is enough. The web config is **public/safe to
expose**. Sync stays off until these steps are done. (Your **API keys are never synced** — they stay
in the browser.)

Project already created: **`cookingmonsta-94ec3`**.

## 1. Enable Google sign-in

Firebase console → **Build → Authentication → Get started → Sign-in method → Google → Enable**
(pick a support email), Save.

## 2. Authorize the Pages domain

**Authentication → Settings → Authorized domains → Add domain:** `antonlomovatskyi.github.io`
(keep `localhost` for dev).

## 3. Firestore rules

**Firestore Database → Rules** → paste and **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Each signed-in user can read/write only their own `users/{uid}` document.

## 4. Web config → GitHub repo Variables

The build reads the Firebase config from repo **Variables** (Settings → Secrets and variables →
Actions → **Variables**). Names must match exactly:

```
VITE_FIREBASE_API_KEY               AIzaSyAqoOdiXXxhY_SzvfhFN8D_I22vl2ZOsVI
VITE_FIREBASE_AUTH_DOMAIN           cookingmonsta-94ec3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID            cookingmonsta-94ec3
VITE_FIREBASE_STORAGE_BUCKET        cookingmonsta-94ec3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID   712753417427
VITE_FIREBASE_APP_ID                1:712753417427:web:4b5abd0141232db7045826
```

Re-run the **Deploy web to GitHub Pages** workflow (or push any commit) so the build picks them up.

## How it works

- Settings → **Sync** → **Sign in with Google**.
- On login: your cloud copy loads into the app. First login on a new account seeds the cloud from
  local. After that, local changes auto-save (debounced ~1.5s). Manual **Save to cloud** / **Load**
  buttons are there too.
- Sign in with the **same Google account** on phone and PC to share data.
