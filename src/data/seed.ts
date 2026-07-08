import type { Recipe } from "@/types/recipe";

/**
 * A small starter set of recipes so the app isn't empty on first run. Bilingual (en/uk), metric
 * units only, with rough per-serving calorie and price (₴, Ukrainian supermarket) estimates.
 */

// Common bilingual units, so seeds stay consistent.
const G = { en: "g", uk: "г" };
const ML = { en: "ml", uk: "мл" };
const TBSP = { en: "tbsp", uk: "ст. л." };
const TSP = { en: "tsp", uk: "ч. л." };
const CLOVE = { en: "clove", uk: "зубчик" };

export const SEED_RECIPES: Recipe[] = [
  {
    id: "garlic-butter-pasta",
    title: { en: "Garlic Butter Pasta", uk: "Паста з часниковим маслом" },
    description: {
      en: "A 15-minute weeknight rescue: silky butter-emulsion sauce with a hit of garlic and parmesan.",
      uk: "Порятунок буднього вечора за 15 хвилин: шовковистий масляний соус із часником і пармезаном.",
    },
    servings: 2,
    prepMinutes: 5,
    cookMinutes: 12,
    cuisine: { en: "Italian", uk: "Італійська" },
    difficulty: "easy",
    tags: ["dinner", "vegetarian", "quick", "pasta", "comfort"],
    caloriesPerServing: 650,
    priceUah: 60,
    ingredients: [
      { name: { en: "spaghetti", uk: "спагеті" }, quantity: 200, unit: G },
      { name: { en: "unsalted butter", uk: "несолоне вершкове масло" }, quantity: 60, unit: G },
      {
        name: { en: "garlic", uk: "часник" },
        quantity: 4,
        unit: CLOVE,
        note: { en: "thinly sliced", uk: "тонко нарізаний" },
      },
      {
        name: { en: "parmesan", uk: "пармезан" },
        quantity: 40,
        unit: G,
        note: { en: "finely grated", uk: "дрібно натертий" },
      },
      { name: { en: "parsley", uk: "петрушка" }, note: { en: "chopped, to finish", uk: "подрібнена, для подачі" } },
      { name: { en: "chilli flakes", uk: "пластівці чилі" }, note: { en: "optional", uk: "за бажанням" } },
      { name: { en: "salt & black pepper", uk: "сіль і чорний перець" }, note: { en: "to taste", uk: "за смаком" } },
    ],
    steps: [
      {
        en: "Boil the spaghetti in well-salted water until just shy of al dente. Reserve a mug of pasta water before draining.",
        uk: "Відвари спагеті в добре підсоленій воді до стану ледь твердіше за al dente. Перед зливанням залиш чашку води від пасти.",
      },
      {
        en: "Meanwhile melt the butter in a wide pan over medium-low heat. Add the garlic (and chilli flakes) and cook gently until fragrant but not browned, about 2 minutes.",
        uk: "Тим часом розтопи масло у широкій сковороді на середньо-слабкому вогні. Додай часник (і чилі) та прогрій до аромату, не даючи підрум'янитися, близько 2 хвилин.",
      },
      {
        en: "Add the drained pasta to the pan with a splash of pasta water. Toss hard so the butter and starch emulsify into a glossy sauce.",
        uk: "Переклади пасту в сковороду з невеликою кількістю води від пасти. Енергійно перемішуй, щоб масло і крохмаль утворили глянцевий соус.",
      },
      {
        en: "Off the heat, add the parmesan and toss again, loosening with more pasta water until silky.",
        uk: "Зніми з вогню, додай пармезан і ще раз перемішай, розводячи водою від пасти до шовковистості.",
      },
      {
        en: "Season, fold through the parsley, and serve immediately with extra cheese.",
        uk: "Приправ, додай петрушку і подавай одразу з додатковим сиром.",
      },
    ],
    source: { type: "manual" },
    createdAt: 1700000000000,
  },
  {
    id: "shakshuka",
    title: { en: "Shakshuka", uk: "Шакшука" },
    description: {
      en: "Eggs poached in a spiced tomato and pepper sauce — brunch that eats like dinner.",
      uk: "Яйця, томлені в пряному соусі з томатів і перцю — сніданок, ситний як вечеря.",
    },
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 25,
    cuisine: { en: "Middle Eastern", uk: "Близькосхідна" },
    difficulty: "easy",
    tags: ["breakfast", "brunch", "vegetarian", "eggs", "one-pan"],
    caloriesPerServing: 430,
    priceUah: 85,
    ingredients: [
      { name: { en: "olive oil", uk: "оливкова олія" }, quantity: 2, unit: TBSP },
      { name: { en: "onion", uk: "цибуля" }, quantity: 1, note: { en: "diced", uk: "нарізана кубиками" } },
      {
        name: { en: "red bell pepper", uk: "червоний болгарський перець" },
        quantity: 1,
        note: { en: "diced", uk: "нарізаний кубиками" },
      },
      { name: { en: "garlic", uk: "часник" }, quantity: 3, unit: CLOVE, note: { en: "minced", uk: "подрібнений" } },
      { name: { en: "ground cumin", uk: "мелений кмин" }, quantity: 1, unit: TSP },
      { name: { en: "smoked paprika", uk: "копчена паприка" }, quantity: 1, unit: TSP },
      {
        name: { en: "chopped tomatoes", uk: "подрібнені томати" },
        quantity: 400,
        unit: G,
        note: { en: "1 tin", uk: "1 банка" },
      },
      { name: { en: "eggs", uk: "яйця" }, quantity: 4 },
      { name: { en: "feta", uk: "фета" }, quantity: 60, unit: G, note: { en: "crumbled", uk: "покришена" } },
      { name: { en: "coriander", uk: "кінза" }, note: { en: "to finish", uk: "для подачі" } },
    ],
    steps: [
      {
        en: "Heat the oil in a frying pan and soften the onion and pepper over medium heat for about 8 minutes.",
        uk: "Розігрій олію на сковороді та пасеруй цибулю з перцем на середньому вогні близько 8 хвилин.",
      },
      {
        en: "Add the garlic, cumin and paprika and cook for 1 minute until fragrant.",
        uk: "Додай часник, кмин і паприку, готуй 1 хвилину до аромату.",
      },
      {
        en: "Pour in the tomatoes, season, and simmer for 10 minutes until thickened.",
        uk: "Влий томати, приправ і томи 10 хвилин до загустіння.",
      },
      {
        en: "Make wells in the sauce and crack an egg into each. Cover and cook 6–8 minutes until the whites set but yolks stay runny.",
        uk: "Зроби заглиблення в соусі та вбий у кожне яйце. Накрий кришкою і готуй 6–8 хвилин, поки білки схопляться, а жовтки лишаться рідкими.",
      },
      {
        en: "Scatter over feta and coriander and serve with crusty bread.",
        uk: "Посип фетою та кінзою, подавай із хрустким хлібом.",
      },
    ],
    source: { type: "manual" },
    createdAt: 1700000100000,
  },
  {
    id: "chicken-teriyaki-bowl",
    title: { en: "Chicken Teriyaki Bowl", uk: "Боул з куркою теріякі" },
    description: {
      en: "Sticky-sweet glazed chicken thighs over rice — no bottled sauce required.",
      uk: "Липка солодкувата глазурована курка на рисі — без покупного соусу.",
    },
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 15,
    cuisine: { en: "Japanese", uk: "Японська" },
    difficulty: "easy",
    tags: ["dinner", "chicken", "rice", "meal-prep"],
    caloriesPerServing: 700,
    priceUah: 65,
    ingredients: [
      { name: { en: "boneless chicken thighs", uk: "філе курячих стегон" }, quantity: 400, unit: G },
      { name: { en: "soy sauce", uk: "соєвий соус" }, quantity: 3, unit: TBSP },
      { name: { en: "mirin", uk: "мірін" }, quantity: 2, unit: TBSP },
      { name: { en: "sugar", uk: "цукор" }, quantity: 1, unit: TBSP },
      { name: { en: "garlic", uk: "часник" }, quantity: 1, unit: CLOVE, note: { en: "grated", uk: "натертий" } },
      { name: { en: "ginger", uk: "імбир" }, quantity: 1, unit: TSP, note: { en: "grated", uk: "натертий" } },
      {
        name: { en: "cooked rice", uk: "варений рис" },
        quantity: 300,
        unit: G,
        note: { en: "2 bowls", uk: "2 миски" },
      },
      {
        name: { en: "spring onion & sesame seeds", uk: "зелена цибуля і кунжут" },
        note: { en: "to garnish", uk: "для прикрашання" },
      },
    ],
    steps: [
      {
        en: "Whisk the soy, mirin, sugar, garlic and ginger together to make the teriyaki sauce.",
        uk: "Змішай соєвий соус, мірін, цукор, часник та імбир — це соус теріякі.",
      },
      {
        en: "Sear the chicken thighs smooth side down in a hot dry pan until golden, then flip and cook through, about 10 minutes total.",
        uk: "Обсмаж курячі стегна гладким боком донизу на гарячій сухій сковороді до золотистості, переверни і доготуй, разом близько 10 хвилин.",
      },
      {
        en: "Pour in the sauce and let it bubble and reduce, spooning it over the chicken until sticky and glossy.",
        uk: "Влий соус і дай йому покипіти й загуснути, поливаючи ним курку, поки не стане липким і глянцевим.",
      },
      {
        en: "Slice the chicken and serve over rice, drizzled with the pan sauce and topped with spring onion and sesame.",
        uk: "Наріж курку і подай на рисі, поливши соусом зі сковороди та посипавши зеленою цибулею і кунжутом.",
      },
    ],
    source: { type: "manual" },
    createdAt: 1700000200000,
  },
  {
    id: "classic-guacamole",
    title: { en: "Classic Guacamole", uk: "Класичний гуакамоле" },
    description: {
      en: "Chunky, bright and 5 minutes flat. The one you'll actually remember.",
      uk: "Текстурний, яскравий і рівно 5 хвилин. Той, який справді запам'ятається.",
    },
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 0,
    cuisine: { en: "Mexican", uk: "Мексиканська" },
    difficulty: "easy",
    tags: ["snack", "vegan", "no-cook", "dip", "party"],
    caloriesPerServing: 190,
    priceUah: 40,
    ingredients: [
      { name: { en: "ripe avocados", uk: "стиглі авокадо" }, quantity: 3 },
      { name: { en: "lime", uk: "лайм" }, quantity: 1, note: { en: "juiced", uk: "тільки сік" } },
      {
        name: { en: "red onion", uk: "червона цибуля" },
        quantity: 0.5,
        note: { en: "finely diced", uk: "дрібно нарізана" },
      },
      {
        name: { en: "coriander", uk: "кінза" },
        quantity: 15,
        unit: G,
        note: { en: "chopped", uk: "подрібнена" },
      },
      {
        name: { en: "jalapeño", uk: "халапеньйо" },
        quantity: 1,
        note: { en: "minced, optional", uk: "подрібнений, за бажанням" },
      },
      { name: { en: "salt", uk: "сіль" }, note: { en: "to taste", uk: "за смаком" } },
    ],
    steps: [
      {
        en: "Halve the avocados, scoop into a bowl and mash to your preferred texture — leave it chunky.",
        uk: "Розріж авокадо навпіл, виклади м'якуш у миску та розімни до бажаної текстури — залиш шматочки.",
      },
      {
        en: "Fold through the lime juice, onion, coriander and jalapeño.",
        uk: "Додай сік лайма, цибулю, кінзу та халапеньйо, перемішай.",
      },
      {
        en: "Season generously with salt, taste, and adjust the lime. Serve straight away.",
        uk: "Щедро посоли, скуштуй і відрегулюй кількість лайма. Подавай одразу.",
      },
    ],
    source: { type: "manual" },
    createdAt: 1700000300000,
  },
  {
    id: "banana-oat-pancakes",
    title: { en: "Banana Oat Pancakes", uk: "Бананово-вівсяні панкейки" },
    description: {
      en: "Flourless, naturally sweet pancakes from three storecupboard staples.",
      uk: "Панкейки без борошна, природно солодкі, з трьох базових продуктів.",
    },
    servings: 2,
    prepMinutes: 5,
    cookMinutes: 10,
    cuisine: { en: "American", uk: "Американська" },
    difficulty: "easy",
    tags: ["breakfast", "vegetarian", "healthy", "quick"],
    caloriesPerServing: 390,
    priceUah: 25,
    ingredients: [
      { name: { en: "ripe banana", uk: "стиглий банан" }, quantity: 2 },
      { name: { en: "rolled oats", uk: "вівсяні пластівці" }, quantity: 100, unit: G },
      { name: { en: "eggs", uk: "яйця" }, quantity: 2 },
      { name: { en: "baking powder", uk: "розпушувач" }, quantity: 1, unit: TSP },
      { name: { en: "cinnamon", uk: "кориця" }, quantity: 0.5, unit: TSP },
      { name: { en: "butter or oil", uk: "масло або олія" }, note: { en: "for the pan", uk: "для сковороди" } },
    ],
    steps: [
      {
        en: "Blend the banana, oats, eggs, baking powder and cinnamon to a smooth batter and let it sit 5 minutes to thicken.",
        uk: "Збий блендером банани, вівсянку, яйця, розпушувач і корицю до однорідного тіста, дай постояти 5 хвилин, щоб загусло.",
      },
      {
        en: "Heat a little butter in a non-stick pan over medium heat. Spoon in small rounds of batter.",
        uk: "Розігрій трохи масла на антипригарній сковороді на середньому вогні. Виливай невеликі кружечки тіста.",
      },
      {
        en: "Cook until bubbles form and the edges set, about 2 minutes, then flip and cook 1–2 minutes more.",
        uk: "Смаж, поки не з'являться бульбашки і краї не схопляться, близько 2 хвилин, потім переверни і смаж ще 1–2 хвилини.",
      },
      {
        en: "Stack and serve with fruit, yoghurt or a drizzle of maple syrup.",
        uk: "Склади стосиком і подавай із фруктами, йогуртом або кленовим сиропом.",
      },
    ],
    source: { type: "manual" },
    createdAt: 1700000400000,
  },
  {
    id: "thai-green-curry",
    title: { en: "Thai Green Curry", uk: "Тайський зелений каррі" },
    description: {
      en: "Fragrant coconut curry loaded with vegetables — dinner in half an hour.",
      uk: "Ароматний кокосовий каррі з овочами — вечеря за пів години.",
    },
    servings: 3,
    prepMinutes: 15,
    cookMinutes: 20,
    cuisine: { en: "Thai", uk: "Тайська" },
    difficulty: "medium",
    tags: ["dinner", "curry", "coconut", "spicy"],
    caloriesPerServing: 650,
    priceUah: 95,
    ingredients: [
      { name: { en: "green curry paste", uk: "паста зеленого каррі" }, quantity: 3, unit: TBSP },
      {
        name: { en: "coconut milk", uk: "кокосове молоко" },
        quantity: 400,
        unit: ML,
        note: { en: "1 tin", uk: "1 банка" },
      },
      {
        name: { en: "chicken breast or tofu", uk: "куряче філе або тофу" },
        quantity: 400,
        unit: G,
        note: { en: "sliced", uk: "нарізане" },
      },
      { name: { en: "fish sauce", uk: "рибний соус" }, quantity: 1, unit: TBSP },
      { name: { en: "sugar", uk: "цукор" }, quantity: 1, unit: TSP },
      {
        name: { en: "mixed vegetables", uk: "овочі (мікс)" },
        quantity: 300,
        unit: G,
        note: { en: "e.g. aubergine, beans, pepper", uk: "напр. баклажан, квасоля, перець" },
      },
      { name: { en: "thai basil & lime", uk: "тайський базилік і лайм" }, note: { en: "to finish", uk: "для подачі" } },
      { name: { en: "jasmine rice", uk: "жасминовий рис" }, note: { en: "to serve", uk: "для подачі" } },
    ],
    steps: [
      {
        en: "Fry the curry paste in a splash of the thick coconut cream over medium heat until fragrant and the oil splits, about 2 minutes.",
        uk: "Обсмаж пасту каррі в ложці густих кокосових вершків на середньому вогні до аромату й відділення олії, близько 2 хвилин.",
      },
      {
        en: "Add the chicken or tofu and stir to coat, then pour in the rest of the coconut milk.",
        uk: "Додай курку або тофу, перемішай, потім влий решту кокосового молока.",
      },
      {
        en: "Season with fish sauce and sugar, bring to a gentle simmer, and add the vegetables.",
        uk: "Приправ рибним соусом і цукром, доведи до легкого кипіння та додай овочі.",
      },
      {
        en: "Simmer until the protein is cooked and the veg is tender, about 12 minutes.",
        uk: "Томи, поки білок не приготується, а овочі не стануть м'якими, близько 12 хвилин.",
      },
      {
        en: "Finish with a squeeze of lime and a handful of thai basil. Serve over jasmine rice.",
        uk: "Заверши соком лайма та жменею тайського базиліку. Подавай із жасминовим рисом.",
      },
    ],
    source: { type: "manual" },
    createdAt: 1700000500000,
  },
];
