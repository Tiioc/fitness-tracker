import { NextRequest, NextResponse } from "next/server";

interface OFFProduct {
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
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
    // Sort by popularity so recognizable products surface first; pull extra so
    // we can drop entries missing nutrition data and still return a full list.
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=25&sort_by=unique_scans_n&fields=product_name,product_name_en,generic_name,brands,nutriments,serving_size`;
    const res = await fetch(url, { headers: { "User-Agent": "TrainingLog/1.0 (fitness app)" }, next: { revalidate: 3600 } });
    const data = await res.json();

    const seen = new Set<string>();
    const results = ((data.products ?? []) as OFFProduct[])
      .map((p) => {
        const base = p.product_name || p.product_name_en || p.generic_name;
        if (!base) return null;
        const brand = p.brands ? p.brands.split(",")[0].trim() : "";
        const name = brand && !base.toLowerCase().includes(brand.toLowerCase())
          ? `${base} (${brand})`
          : base;
        const kcal = p.nutriments?.["energy-kcal_100g"];
        if (kcal == null) return null;
        return {
          name,
          calories: Math.round(kcal),
          protein: Math.round(p.nutriments?.["proteins_100g"] ?? 0),
          carbs: Math.round(p.nutriments?.["carbohydrates_100g"] ?? 0),
          fat: Math.round(p.nutriments?.["fat_100g"] ?? 0),
          servingSize: p.serving_size,
        };
      })
      .filter((r): r is NonNullable<typeof r> => {
        if (!r) return false;
        const key = r.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
