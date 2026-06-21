import { NextRequest, NextResponse } from "next/server";

interface OFFProduct {
  product_name?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "proteins_100g"?: number;
    "carbohydrates_100g"?: number;
    "fat_100g"?: number;
  };
  serving_size?: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json([]);

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,nutriments,serving_size`;
    const res = await fetch(url, { headers: { "User-Agent": "TrainingLog/1.0" }, next: { revalidate: 3600 } });
    const data = await res.json();

    const results = (data.products as OFFProduct[])
      .filter((p) => p.product_name && p.nutriments?.["energy-kcal_100g"] != null)
      .map((p) => ({
        name: p.product_name!,
        calories: Math.round(p.nutriments!["energy-kcal_100g"]!),
        protein: Math.round(p.nutriments!["proteins_100g"] ?? 0),
        carbs: Math.round(p.nutriments!["carbohydrates_100g"] ?? 0),
        fat: Math.round(p.nutriments!["fat_100g"] ?? 0),
        servingSize: p.serving_size,
      }))
      .slice(0, 6);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
