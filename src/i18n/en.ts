/** English UI strings. `Strings` is the authoritative shape; uk.ts mirrors it. */
export interface Strings {
  tabs: { recipes: string; import: string; saved: string };
  home: {
    search: string;
    importTitle: string;
    importSub: string;
    sort: { recent: string; title: string; time: string; cooked: string };
    count: string;
    none: string;
    importFirst: string;
  };
  detail: {
    notFound: string;
    min: string;
    base: string;
    cook: string;
    ingredients: string;
    method: string;
    notes: string;
    notesPh: string;
    cookedBtn: string;
    loggedMsg: string;
    from: string;
    watch: string;
    serving: string;
    servings: string;
    kcal: string;
    perServing: string;
    deleteConfirm: string;
  };
  cookMode: { step: string; of: string; ingredients: string; next: string; done: string; noSteps: string };
  importPage: {
    title: string;
    sub: string; // contains {model}
    link: string;
    text: string;
    optional: string;
    textPh: string;
    extract: string;
    fetching: string;
    extracting: string;
    needKey: string;
    addKey: string;
    openSettings: string;
    how: string;
    how1: string;
    how2: string;
    how3: string; // contains {model}
    how4: string;
    errNoKey: string;
    errNeedText: string;
    errYt: string; // contains {err}
    errNothing: string;
  };
  editor: {
    newR: string;
    editR: string;
    review: string;
    reviewSub: string;
    langHint: string;
    title: string;
    titlePh: string;
    needTitle: string;
    description: string;
    servings: string;
    prep: string;
    cookMin: string;
    cuisine: string;
    difficulty: string;
    kcal: string;
    price: string;
    tags: string;
    tagsPh: string;
    ingredients: string;
    qty: string;
    unit: string;
    ingredient: string;
    addIngredient: string;
    method: string;
    methodPh: string;
    save: string;
    del: string;
    delConfirm: string;
  };
  favs: { title: string; empty: string; emptyHint: string; recentlyCooked: string };
  settings: {
    aiImport: string;
    anthropicKey: string;
    keyNote: string;
    model: string;
    sync: string;
    syncOff: string;
    signedInAs: string;
    syncing: string;
    savedCloud: string;
    syncErr: string;
    saveCloud: string;
    load: string;
    signOut: string;
    signInNote: string;
    signIn: string;
    appearance: string;
    theme: string;
    dark: string;
    light: string;
    language: string;
    sections: string;
    addByHand: string;
    backup: string;
    exportData: string;
    importData: string;
    data: string;
    recipes: string;
    saved: string;
    cooked: string;
    clearCooked: string;
    clearCookedConfirm: string;
    clearFavs: string;
    clearFavsConfirm: string;
  };
  difficulty: { easy: string; medium: string; hard: string };
}

export const en: Strings = {
  tabs: { recipes: "Recipes", import: "Import", saved: "Saved" },
  home: {
    search: "Search recipes, ingredients…",
    importTitle: "Import from YouTube",
    importSub: "Paste a link — Claude pulls out the ingredients & steps.",
    sort: { recent: "Newest", title: "A–Z", time: "Quickest", cooked: "Most cooked" },
    count: "recipes",
    none: "No recipes match.",
    importFirst: "Import your first one",
  },
  detail: {
    notFound: "Recipe not found.",
    min: "min",
    base: "base",
    cook: "Cook",
    ingredients: "Ingredients",
    method: "Method",
    notes: "Your notes",
    notesPh: "Tweaks, timings, what you'd change next time…",
    cookedBtn: "✅ I cooked this",
    loggedMsg: "Logged — nice one! 🍽️",
    from: "From",
    watch: "Watch the original",
    serving: "serving",
    servings: "servings",
    kcal: "kcal",
    perServing: "/ serving",
    deleteConfirm: "Delete this recipe? This can't be undone.",
  },
  cookMode: {
    step: "Step",
    of: "of",
    ingredients: "Ingredients",
    next: "Next",
    done: "Done cooking",
    noSteps: "No steps recorded for this recipe.",
  },
  importPage: {
    title: "Import a recipe",
    sub: "Paste a cooking video — extraction by {model}.",
    link: "YouTube link",
    text: "Recipe text",
    optional: "(optional / fallback)",
    textPh:
      "Paste the video description or any recipe text here — useful if auto-fetch fails, or to import from anywhere, not just YouTube.",
    extract: "Extract recipe",
    fetching: "Fetching video…",
    extracting: "Extracting recipe…",
    needKey: "You'll need an Anthropic API key.",
    addKey: "Add it in Settings",
    openSettings: "Open Settings",
    how: "How it works",
    how1: "Paste a YouTube cooking video link.",
    how2: "The description & top comments are fetched automatically. If that fails, paste the description into the box above.",
    how3: "Claude ({model}) reads it and structures the ingredients & steps — in English and Ukrainian, with calorie and price estimates.",
    how4: "You review & tweak, then save it to your collection.",
    errNoKey: "Add your Anthropic API key in Settings to enable extraction.",
    errNeedText:
      "Fetched the video title, but couldn't get the description automatically. Paste the video description below to continue.",
    errYt: "YouTube API error: {err}. Paste the video description below to continue.",
    errNothing: "Paste a YouTube link or some recipe text to get started.",
  },
  editor: {
    newR: "New recipe",
    editR: "Edit recipe",
    review: "Review imported recipe",
    reviewSub: "Claude did the heavy lifting — check it over, then save.",
    langHint: "You're editing the English text. Switch the app language in Settings to edit the Ukrainian side.",
    title: "Title",
    titlePh: "e.g. Garlic Butter Pasta",
    needTitle: "Give it a title.",
    description: "Description",
    servings: "Servings",
    prep: "Prep (min)",
    cookMin: "Cook (min)",
    cuisine: "Cuisine",
    difficulty: "Difficulty",
    kcal: "kcal / serving",
    price: "₴ / serving",
    tags: "Tags",
    tagsPh: "dinner, vegetarian, quick (comma-separated)",
    ingredients: "Ingredients",
    qty: "Qty",
    unit: "Unit",
    ingredient: "Ingredient",
    addIngredient: "Add ingredient",
    method: "Method",
    methodPh: "One step per line",
    save: "Save recipe",
    del: "Delete",
    delConfirm: "Delete this recipe?",
  },
  favs: {
    title: "Saved",
    empty: "No favourites yet.",
    emptyHint: "Tap the heart on any recipe to save it here.",
    recentlyCooked: "Recently cooked",
  },
  settings: {
    aiImport: "AI import",
    anthropicKey: "Anthropic API key",
    keyNote: "Stored in this browser; when you sign in with Google it also syncs privately to your account, so your other devices get it automatically. Never bundled into the site or included in backup files.",
    model: "Extraction model",
    sync: "Sync",
    syncOff: "Cloud sync isn't configured for this build. Your data lives on this device — use the backup below to move it.",
    signedInAs: "Signed in as",
    syncing: "Syncing…",
    savedCloud: "Saved to cloud ✓",
    syncErr: "Sync error",
    saveCloud: "Save to cloud",
    load: "Load",
    signOut: "Sign out",
    signInNote: "Sign in to sync your recipes, favourites & notes across devices.",
    signIn: "Sign in with Google",
    appearance: "Appearance",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    language: "Language",
    sections: "Sections",
    addByHand: "＋ Add a recipe by hand",
    backup: "Backup",
    exportData: "⬆️ Export data",
    importData: "⬇️ Import data",
    data: "Data",
    recipes: "Recipes",
    saved: "Saved",
    cooked: "Cooked",
    clearCooked: "Clear cook log",
    clearCookedConfirm: "Clear your cook log?",
    clearFavs: "Clear favourites",
    clearFavsConfirm: "Clear all favourites?",
  },
  difficulty: { easy: "easy", medium: "medium", hard: "hard" },
};
