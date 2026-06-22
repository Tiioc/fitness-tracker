import { NextRequest, NextResponse } from "next/server";

// Look up a product by barcode via OpenFoodFacts (same source MyFitnessPal-style
// scanners use). Returns per-100g macros plus serving info when available.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No barcode" }, { status: 400 });

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=product_name,product_name_en,brands,nutriments,serving_size,serving_quantity`;
    const res = await fetch(url, { headers: { "User-Agent": "TrainingLog/1.0 (fitness app)" }, next: { revalidate: 86400 } });
    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const p = data.product;
    const n = p.nutriments ?? {};
    const kcal = n["energy-kcal_100g"];
    if (kcal == null) return NextResponse.json({ error: "no_nutrition" }, { status: 404 });

    const base = p.product_name || p.product_name_en || "Scanned product";
    const brand = p.brands ? String(p.brands).split(",")[0].trim() : "";
    const name = brand && !base.toLowerCase().includes(brand.toLowerCase()) ? `${base} (${brand})` : base;

    const servingGrams = typeof p.serving_quantity === "number" ? p.serving_quantity
      : parseFloat(p.serving_quantity) || null;

    return NextResponse.json({
      name,
      calories: Math.round(kcal),
      protein: Math.round(n["proteins_100g"] ?? 0),
      carbs: Math.round(n["carbohydrates_100g"] ?? 0),
      fat: Math.round(n["fat_100g"] ?? 0),
      servings: servingGrams && servingGrams > 0
        ? [{ label: p.serving_size || `1 serving`, grams: servingGrams }, { label: "100 g", grams: 100 }]
        : undefined,
    });
  } catch {
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}
