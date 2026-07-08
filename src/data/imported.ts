import type { Recipe } from "@/types/recipe";
import aLittleCalm from "./imported/a-little-calm.json";

/**
 * Recipes imported via the `/import-recipe` Claude Code skill (see .claude/skills/import-recipe)
 * and the `scripts/import-channel.mjs` batch importer (whole-channel sync → JSON files in
 * ./imported/). Committed to the repo and bundled into the deploy, so they appear on every device
 * without needing an API key or Firebase sync. Newest first. Bilingual, metric units only.
 */
const CHANNEL_RECIPES = aLittleCalm as unknown as Recipe[];

const HAND_IMPORTED: Recipe[] = [
  {
    id: "cheesy-pizza-rolls",
    title: { en: "Cheesy Pizza Rolls", uk: "Сирні піца-роли" },
    description: {
      en: "Cinnamon rolls, but make it pizza: soft garlicky yeast rolls swirled with tomato sauce and mozzarella, brushed with garlic butter.",
      uk: "Сінабони, але у стилі піци: м'які часникові дріжджові роли з томатним соусом і моцарелою, змащені часниковим маслом.",
    },
    servings: 12,
    prepMinutes: 110,
    cookMinutes: 30,
    cuisine: { en: "Italian-American", uk: "Італійсько-американська" },
    difficulty: "medium",
    tags: ["baking", "pizza", "cheese", "bread", "snack", "comfort"],
    caloriesPerServing: 270,
    priceUah: 30,
    ingredients: [
      {
        name: { en: "warm water", uk: "тепла вода" },
        quantity: 180,
        unit: { en: "ml", uk: "мл" },
        note: { en: "for the yeast mixture", uk: "для дріжджової суміші" },
      },
      { name: { en: "active dry yeast", uk: "сухі активні дріжджі" }, quantity: 2.5, unit: { en: "tsp", uk: "ч. л." } },
      { name: { en: "sugar", uk: "цукор" }, quantity: 1, unit: { en: "tbsp", uk: "ст. л." } },
      { name: { en: "all-purpose flour", uk: "пшеничне борошно" }, quantity: 360, unit: { en: "g", uk: "г" } },
      {
        name: { en: "butter", uk: "вершкове масло" },
        quantity: 57,
        unit: { en: "g", uk: "г" },
        note: { en: "melted, for the dough", uk: "розтоплене, для тіста" },
      },
      { name: { en: "egg", uk: "яйце" }, quantity: 1 },
      { name: { en: "egg yolk", uk: "яєчний жовток" }, quantity: 1 },
      { name: { en: "salt", uk: "сіль" }, quantity: 1, unit: { en: "tsp", uk: "ч. л." } },
      {
        name: { en: "garlic powder", uk: "часниковий порошок" },
        quantity: 1,
        unit: { en: "tsp", uk: "ч. л." },
        note: { en: "for the dough", uk: "для тіста" },
      },
      { name: { en: "onion powder", uk: "цибулевий порошок" }, quantity: 1, unit: { en: "tsp", uk: "ч. л." } },
      { name: { en: "dried oregano", uk: "сушений орегано" }, quantity: 1, unit: { en: "tsp", uk: "ч. л." } },
      {
        name: { en: "olive oil", uk: "оливкова олія" },
        quantity: 2,
        unit: { en: "tsp", uk: "ч. л." },
        note: { en: "for the filling", uk: "для начинки" },
      },
      { name: { en: "tomato sauce", uk: "томатний соус" }, quantity: 120, unit: { en: "g", uk: "г" } },
      {
        name: { en: "shredded mozzarella", uk: "терта моцарела" },
        quantity: 225,
        unit: { en: "g", uk: "г" },
        note: {
          en: "plus extra for the pan and the tops",
          uk: "плюс ще трохи для форми та зверху",
        },
      },
      {
        name: { en: "butter", uk: "вершкове масло" },
        quantity: 43,
        unit: { en: "g", uk: "г" },
        note: { en: "melted, for the topping", uk: "розтоплене, для змащування" },
      },
      {
        name: { en: "garlic powder", uk: "часниковий порошок" },
        quantity: 0.5,
        unit: { en: "tsp", uk: "ч. л." },
        note: { en: "for the topping", uk: "для змащування" },
      },
      {
        name: { en: "parsley", uk: "петрушка" },
        quantity: 1,
        unit: { en: "tsp", uk: "ч. л." },
        note: { en: "dried or fresh, for the topping", uk: "сушена або свіжа, для змащування" },
      },
    ],
    steps: [
      {
        en: "Mix the warm water, yeast and sugar and let rest for 10 minutes until foamy.",
        uk: "Змішай теплу воду, дріжджі та цукор і залиш на 10 хвилин, поки суміш не запіниться.",
      },
      {
        en: "Add the flour, melted butter, egg, egg yolk, salt, garlic powder, onion powder and oregano to the yeast mixture and knead for 5–7 minutes. If the dough is too sticky, add flour 1 tbsp at a time — it should stay slightly tacky.",
        uk: "Додай до дріжджової суміші борошно, розтоплене масло, яйце, жовток, сіль, часниковий і цибулевий порошок та орегано, вимішуй 5–7 хвилин. Якщо тісто надто липке — додавай борошно по 1 ст. л.; воно має лишатися трохи липким.",
      },
      {
        en: "Oil your hands, gather the dough into a ball, place it in a bowl, cover and let rise for 1 hour.",
        uk: "Змасти руки олією, збери тісто в кулю, поклади в миску, накрий і дай піднятися 1 годину.",
      },
      {
        en: "Roll the dough out, spread with the olive oil and tomato sauce, scatter over the mozzarella, then roll up and slice into 12 rolls.",
        uk: "Розкачай тісто, змасти оливковою олією і томатним соусом, посип моцарелою, згорни рулетом і наріж на 12 ролів.",
      },
      {
        en: "Sprinkle extra mozzarella over the bottom of the pan, arrange the rolls, top with more mozzarella, cover and let rest for 30 minutes.",
        uk: "Посип дно форми моцарелою, виклади роли, посип сиром зверху, накрий і дай відпочити 30 хвилин.",
      },
      {
        en: "Bake at 177°C (350°F) for 28–30 minutes, until the tops are golden brown.",
        uk: "Випікай за 177°C (350°F) 28–30 хвилин, до золотистої скоринки.",
      },
      {
        en: "Mix the melted butter, garlic powder and parsley and brush over the warm rolls.",
        uk: "Змішай розтоплене масло, часниковий порошок і петрушку та змасти теплі роли.",
      },
    ],
    image: "https://i.ytimg.com/vi/Xl6sPC_mIZA/hqdefault.jpg",
    source: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=Xl6sPC_mIZA",
      videoId: "Xl6sPC_mIZA",
      author: "a little calm",
    },
    createdAt: 1783432800000,
  },
  {
    id: "chewy-chocolate-chip-cookies",
    title: { en: "Chewy Chocolate Chip Cookies", uk: "М'яке шоколадне печиво" },
    description: {
      en: "Eggless, chewy chocolate chip cookies with rippled edges. Makes 12 regular (2 tbsp) or 6 large (4 tbsp) cookies.",
      uk: "М'яке печиво з шоколадом без яєць, із хвилястими краями. Виходить 12 звичайних (2 ст. л.) або 6 великих (4 ст. л.) печив.",
    },
    servings: 12,
    prepMinutes: 45,
    cookMinutes: 12,
    cuisine: { en: "American", uk: "Американська" },
    difficulty: "easy",
    tags: ["dessert", "baking", "cookies", "eggless", "sweet"],
    caloriesPerServing: 360,
    priceUah: 25,
    ingredients: [
      {
        name: { en: "butter", uk: "вершкове масло" },
        quantity: 170,
        unit: { en: "g", uk: "г" },
        note: { en: "melted; salted or unsalted", uk: "розтоплене; солоне або несолоне" },
      },
      { name: { en: "light brown sugar", uk: "світлий коричневий цукор" }, quantity: 150, unit: { en: "g", uk: "г" } },
      { name: { en: "granulated sugar", uk: "білий цукор" }, quantity: 65, unit: { en: "g", uk: "г" } },
      { name: { en: "vanilla extract", uk: "ванільний екстракт" }, quantity: 1.5, unit: { en: "tsp", uk: "ч. л." } },
      {
        name: { en: "milk", uk: "молоко" },
        quantity: 60,
        unit: { en: "ml", uk: "мл" },
        note: { en: "any milk will work", uk: "підійде будь-яке" },
      },
      { name: { en: "all-purpose flour", uk: "пшеничне борошно" }, quantity: 218, unit: { en: "g", uk: "г" } },
      { name: { en: "baking soda", uk: "сода" }, quantity: 0.75, unit: { en: "tsp", uk: "ч. л." } },
      { name: { en: "salt", uk: "сіль" }, quantity: 0.75, unit: { en: "tsp", uk: "ч. л." } },
      { name: { en: "cinnamon", uk: "кориця" }, quantity: 0.5, unit: { en: "tsp", uk: "ч. л." } },
      { name: { en: "cornstarch", uk: "кукурудзяний крохмаль" }, quantity: 2, unit: { en: "tsp", uk: "ч. л." } },
      {
        name: { en: "chocolate", uk: "шоколад" },
        quantity: 270,
        unit: { en: "g", uk: "г" },
        note: {
          en: "e.g. ⅔ chocolate chips + ⅓ chopped semi-sweet bar",
          uk: "напр. ⅔ шоколадних крапель + ⅓ порубаної напівгіркої плитки",
        },
      },
    ],
    steps: [
      {
        en: "Whisk the melted butter, light brown sugar and granulated sugar together until combined.",
        uk: "Збий розтоплене масло зі світлим коричневим і білим цукром до однорідності.",
      },
      { en: "Mix in the vanilla extract and milk.", uk: "Додай ванільний екстракт і молоко, перемішай." },
      {
        en: "Add the flour, baking soda, salt, cinnamon and cornstarch and mix until a soft dough forms — don't overmix.",
        uk: "Додай борошно, соду, сіль, корицю і крохмаль, заміси м'яке тісто — не перемішуй надто довго.",
      },
      { en: "Fold in the chocolate.", uk: "Вмішай шоколад." },
      {
        en: "Scoop into 12 regular (2 tbsp) or 6 large (4 tbsp) dough balls on a lined tray.",
        uk: "Сформуй 12 звичайних (2 ст. л.) або 6 великих (4 ст. л.) кульок тіста на застеленому деку.",
      },
      {
        en: "Freeze the dough balls, uncovered, for 30 minutes.",
        uk: "Замороз кульки тіста, не накриваючи, 30 хвилин.",
      },
      {
        en: "Bake at 177°C (350°F): 10–12 minutes for regular cookies, 12–14 minutes for large. They spread — bake at most 6 regular (or 4 large) per tray.",
        uk: "Випікай за 177°C (350°F): 10–12 хвилин для звичайних, 12–14 для великих. Печиво розтікається — клади не більше 6 звичайних (або 4 великих) на деко.",
      },
      {
        en: "For rippled edges, lightly bang the pan on the counter a couple of times straight out of the oven. Let cool before eating.",
        uk: "Для хвилястих країв легенько стукни деко об стіл кілька разів одразу з духовки. Дай охолонути.",
      },
    ],
    image: "https://i.ytimg.com/vi/1gcLatHJa8o/hqdefault.jpg",
    source: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=1gcLatHJa8o",
      videoId: "1gcLatHJa8o",
      author: "a little calm",
    },
    createdAt: 1783429200000,
  },
];

/** Hand-imported first (they're curated), then the batch-synced channel recipes. */
export const IMPORTED_RECIPES: Recipe[] = [...HAND_IMPORTED, ...CHANNEL_RECIPES];
