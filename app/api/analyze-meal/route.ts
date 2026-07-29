import { NextResponse } from "next/server";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";

type Body = {
  image?: string;
  nutritionGoal?: string;
};

/**
 * Vision meal analysis. Requires server-only OPENAI_API_KEY.
 * Returns 503 when unset so the client can fall back to manual macros.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI meal analysis is not configured. Add OPENAI_API_KEY to enable photo macros." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const image = body.image?.trim();
  if (!image || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Expected a data:image URL." }, { status: 400 });
  }

  // Guard payload size (~1.5MB raw → ~2MB data URL).
  if (image.length > 2_500_000) {
    return NextResponse.json({ error: "Image too large — retake a smaller photo." }, { status: 413 });
  }

  const goal = body.nutritionGoal || "maintain";
  const goalHint =
    goal === "lose"
      ? "The user wants to lose fat — favour protein-forward suggestions and note calorie density."
      : goal === "gain"
        ? "The user wants to build muscle — favour sufficient calories and carbs around training."
        : goal === "recomp"
          ? "The user wants recomposition — high protein, near-maintenance calories."
          : "The user wants to maintain — balanced macros.";

  const prompt = `You are a nutrition coach for ${BRAND.name}, a women's strength & wellness app.
Estimate the meal from the photo. ${goalHint}

Respond with ONLY valid JSON (no markdown) using this shape:
{
  "name": "short meal name",
  "ingredients": "comma-separated likely ingredients",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "suggestion": "one short coaching sentence for their nutrition goal",
  "note": "brief caveat that this is an estimate"
}
Numbers are grams for macros and kcal for calories. Be realistic; if unsure, estimate conservatively.`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MEAL_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const detail = await openaiRes.text();
      return NextResponse.json(
        { error: "Vision provider error", detail: detail.slice(0, 400) },
        { status: 502 },
      );
    }

    const payload = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Could not parse AI response." }, { status: 502 });
    }

    const num = (value: unknown) => {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
    };

    return NextResponse.json({
      name: typeof parsed.name === "string" ? parsed.name : "Meal",
      ingredients: typeof parsed.ingredients === "string" ? parsed.ingredients : "",
      calories: num(parsed.calories),
      protein: num(parsed.protein),
      carbs: num(parsed.carbs),
      fat: num(parsed.fat),
      suggestion: typeof parsed.suggestion === "string" ? parsed.suggestion : "",
      note: typeof parsed.note === "string" ? parsed.note : "AI estimate — edit if needed",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
