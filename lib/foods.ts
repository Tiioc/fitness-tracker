// Built-in common-foods database. Values are per 100g (raw/cooked as noted).
// Searched instantly & offline so staple foods always resolve — OpenFoodFacts
// (branded/barcode products) is layered on top for packaged items.

export interface CommonFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const COMMON_FOODS: CommonFood[] = [
  // ── Eggs & dairy ──
  { name: "Egg, whole", calories: 143, protein: 13, carbs: 1, fat: 10 },
  { name: "Egg white", calories: 52, protein: 11, carbs: 1, fat: 0 },
  { name: "Milk, whole", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: "Milk, 2%", calories: 50, protein: 3.3, carbs: 4.8, fat: 2 },
  { name: "Milk, skim", calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  { name: "Almond milk, unsweetened", calories: 13, protein: 0.4, carbs: 0.3, fat: 1.1 },
  { name: "Greek yogurt, nonfat plain", calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: "Yogurt, whole plain", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  { name: "Cottage cheese, low fat", calories: 72, protein: 12, carbs: 3, fat: 1 },
  { name: "Cheddar cheese", calories: 403, protein: 25, carbs: 1.3, fat: 33 },
  { name: "Mozzarella cheese", calories: 280, protein: 28, carbs: 3, fat: 17 },
  { name: "Butter", calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },

  // ── Meat & seafood ──
  { name: "Chicken breast, cooked", calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: "Chicken thigh, cooked", calories: 209, protein: 26, carbs: 0, fat: 11 },
  { name: "Ground beef 85/15, cooked", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: "Ground beef 90/10, cooked", calories: 217, protein: 26, carbs: 0, fat: 12 },
  { name: "Steak, sirloin cooked", calories: 206, protein: 30, carbs: 0, fat: 9 },
  { name: "Pork chop, cooked", calories: 231, protein: 26, carbs: 0, fat: 14 },
  { name: "Bacon, cooked", calories: 541, protein: 37, carbs: 1, fat: 42 },
  { name: "Turkey breast, cooked", calories: 135, protein: 30, carbs: 0, fat: 1 },
  { name: "Ground turkey, cooked", calories: 203, protein: 27, carbs: 0, fat: 10 },
  { name: "Salmon, cooked", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Tuna, canned in water", calories: 116, protein: 26, carbs: 0, fat: 1 },
  { name: "Tilapia, cooked", calories: 129, protein: 26, carbs: 0, fat: 3 },
  { name: "Shrimp, cooked", calories: 99, protein: 24, carbs: 0, fat: 0.3 },

  // ── Grains & starches ──
  { name: "White rice, cooked", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Brown rice, cooked", calories: 123, protein: 2.7, carbs: 26, fat: 1 },
  { name: "Pasta, cooked", calories: 158, protein: 6, carbs: 31, fat: 1 },
  { name: "Quinoa, cooked", calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: "Oats, dry", calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: "Oatmeal, cooked", calories: 71, protein: 2.5, carbs: 12, fat: 1.5 },
  { name: "Bread, white", calories: 265, protein: 9, carbs: 49, fat: 3 },
  { name: "Bread, whole wheat", calories: 247, protein: 13, carbs: 41, fat: 3 },
  { name: "Bagel, plain", calories: 257, protein: 10, carbs: 50, fat: 1.5 },
  { name: "Tortilla, flour", calories: 304, protein: 8, carbs: 51, fat: 7 },
  { name: "Potato, baked", calories: 93, protein: 2.5, carbs: 21, fat: 0.1 },
  { name: "Sweet potato, cooked", calories: 90, protein: 2, carbs: 21, fat: 0.1 },
  { name: "French fries", calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  { name: "Cereal, corn flakes", calories: 357, protein: 7, carbs: 84, fat: 0.4 },
  { name: "Granola", calories: 471, protein: 10, carbs: 64, fat: 20 },
  { name: "Pancakes", calories: 227, protein: 6, carbs: 28, fat: 9 },

  // ── Fruit ──
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: "Orange", calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { name: "Strawberries", calories: 32, protein: 0.7, carbs: 8, fat: 0.3 },
  { name: "Blueberries", calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { name: "Grapes", calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: "Pineapple", calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
  { name: "Mango", calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  { name: "Watermelon", calories: 30, protein: 0.6, carbs: 8, fat: 0.2 },

  // ── Vegetables ──
  { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: "Carrots", calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { name: "Green beans", calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },
  { name: "Tomato", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: "Cucumber", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: "Bell pepper", calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  { name: "Onion", calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  { name: "Mushrooms", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  { name: "Asparagus", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },

  // ── Legumes, nuts & fats ──
  { name: "Black beans, cooked", calories: 132, protein: 8.9, carbs: 24, fat: 0.5 },
  { name: "Chickpeas, cooked", calories: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  { name: "Lentils, cooked", calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: "Tofu", calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { name: "Hummus", calories: 166, protein: 8, carbs: 14, fat: 10 },
  { name: "Peanut butter", calories: 588, protein: 25, carbs: 20, fat: 50 },
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: "Peanuts", calories: 567, protein: 26, carbs: 16, fat: 49 },
  { name: "Walnuts", calories: 654, protein: 15, carbs: 14, fat: 65 },
  { name: "Cashews", calories: 553, protein: 18, carbs: 30, fat: 44 },
  { name: "Olive oil", calories: 884, protein: 0, carbs: 0, fat: 100 },

  // ── Supplements & extras ──
  { name: "Whey protein powder", calories: 400, protein: 80, carbs: 8, fat: 6 },
  { name: "Protein bar", calories: 350, protein: 30, carbs: 40, fat: 10 },
  { name: "Honey", calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  { name: "Maple syrup", calories: 260, protein: 0, carbs: 67, fat: 0.1 },
  { name: "Dark chocolate", calories: 546, protein: 5, carbs: 61, fat: 31 },
  { name: "Pizza, cheese", calories: 266, protein: 11, carbs: 33, fat: 10 },
  { name: "Orange juice", calories: 45, protein: 0.7, carbs: 10, fat: 0.2 },
  { name: "Soda, cola", calories: 42, protein: 0, carbs: 11, fat: 0 },
  { name: "Coffee, black", calories: 1, protein: 0.1, carbs: 0, fat: 0 },
];

// Token-aware fuzzy search with simple plural stemming so "eggs" → "Egg",
// "carrots" → "Carrot", etc. Ranks: exact > starts-with > word-match > partial.
const stem = (w: string) => w.replace(/(ies|es|s)$/, (m) => (m === "ies" ? "y" : ""));

export function searchCommonFoods(query: string): CommonFood[] {
  const s = query.toLowerCase().trim();
  if (!s) return [];
  const tokenStems = s.split(/\s+/).filter(Boolean).map(stem);

  function score(name: string): number {
    const n = name.toLowerCase();
    const wordStems = n.split(/[\s,()/]+/).filter(Boolean).map(stem);
    if (n === s) return 100;
    if (n.startsWith(s)) return 80;
    // every query token matches the start of some word in the name
    if (tokenStems.every((t) => wordStems.some((w) => w.startsWith(t) || t.startsWith(w)))) return 60;
    if (n.includes(s)) return 45;
    // any meaningful token overlaps a word
    if (tokenStems.some((t) => t.length >= 3 && wordStems.some((w) => w.startsWith(t)))) return 20;
    return 0;
  }

  return COMMON_FOODS
    .map((f) => ({ f, score: score(f.name) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.f);
}
