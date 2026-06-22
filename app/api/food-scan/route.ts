import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const PROMPT = `You are a precise sports-nutrition analyst. Examine this meal photo and identify EVERY visible food item.

Return nutritional values for the ACTUAL PORTIONS shown in the image, not per 100g.

Respond with ONLY valid JSON — no markdown fences, no explanation:
{
  "items": [
    {
      "name": "Descriptive name (e.g. Grilled chicken breast, White rice cooked)",
      "grams": 170,
      "calories": 280,
      "protein": 52,
      "carbs": 0,
      "fat": 6
    }
  ]
}

Accuracy rules:
- Use a standard 10-inch dinner plate as a reference for portion estimation
- Cooked chicken breast: typical 4–6 oz (113–170 g)
- Cooked rice: 1 cup ≈ 195 g, ~240 kcal
- Cooked vegetables: generous side ≈ 100–150 g
- Use USDA FoodData Central nutrient values
- Account for visible cooking method (grilled vs fried affects fat)
- List each distinct food component separately
- For whole foods, prioritise accuracy over caution`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set — add it in Vercel → Settings → Environment Variables" },
      { status: 503 },
    );
  }

  try {
    const { image, mimeType = "image/jpeg" } = (await req.json()) as {
      image: string;
      mimeType?: string;
    };
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: image,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ items: [] });

    const result = JSON.parse(match[0]) as { items: unknown[] };
    return NextResponse.json(result);
  } catch (err) {
    console.error("food-scan:", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
