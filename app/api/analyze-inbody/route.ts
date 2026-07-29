import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  image?: string;
};

/**
 * Vision InBody printout analysis. Requires server-only OPENAI_API_KEY.
 * Returns 503 when unset so the client can fall back to manual entry.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI InBody analysis is not configured. Add OPENAI_API_KEY to enable photo import." },
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

  if (image.length > 2_500_000) {
    return NextResponse.json({ error: "Image too large — retake a clearer photo of the printout." }, { status: 413 });
  }

  const prompt = `You are reading an InBody body-composition printout or screen for FORMA, a women's strength app.
Extract the numeric metrics you can see. Prefer metric units (kg). If only lb is shown, convert to kg (÷ 2.205) and round to 1 decimal.

Respond with ONLY valid JSON (no markdown) using this shape:
{
  "date": "YYYY-MM-DD or empty string if unknown",
  "weightKg": number or null,
  "skeletalMuscleMassKg": number or null,
  "bodyFatMassKg": number or null,
  "bodyFatPercent": number or null,
  "leanBodyMassKg": number or null,
  "visceralFatLevel": number or null,
  "bmi": number or null,
  "bmrKcal": number or null,
  "notes": "brief note if something was ambiguous",
  "confidence": "high" | "medium" | "low"
}
Use null when a field is not visible. Do not invent numbers. Labels may vary (SMM, Soft Lean Mass, PBF, VFL, BMR, etc.).`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_INBODY_MODEL?.trim() || process.env.OPENAI_MEAL_MODEL?.trim() || "gpt-4o-mini",
        temperature: 0.1,
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

    const numOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === "") return null;
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n) || n < 0) return null;
      return Math.round(n * 10) / 10;
    };

    const dateRaw = typeof parsed.date === "string" ? parsed.date.trim().slice(0, 10) : "";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : "";

    return NextResponse.json({
      date,
      weightKg: numOrNull(parsed.weightKg),
      skeletalMuscleMassKg: numOrNull(parsed.skeletalMuscleMassKg),
      bodyFatMassKg: numOrNull(parsed.bodyFatMassKg),
      bodyFatPercent: numOrNull(parsed.bodyFatPercent),
      leanBodyMassKg: numOrNull(parsed.leanBodyMassKg),
      visceralFatLevel: numOrNull(parsed.visceralFatLevel),
      bmi: numOrNull(parsed.bmi),
      bmrKcal: numOrNull(parsed.bmrKcal) !== null ? Math.round(numOrNull(parsed.bmrKcal)!) : null,
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      confidence:
        parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
          ? parsed.confidence
          : "medium",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
