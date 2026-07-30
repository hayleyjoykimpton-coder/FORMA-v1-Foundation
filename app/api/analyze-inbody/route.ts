import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  image?: string;
};

/**
 * Vision InBody printout / screenshot analysis. Requires server-only OPENAI_API_KEY.
 * Tuned for InBody 270 Result Sheets (dense multi-column layout).
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

  // High-res JPEG data URLs of full result sheets can exceed ~2.5MB.
  if (image.length > 6_000_000) {
    return NextResponse.json(
      { error: "Image too large — crop to the result sheet or use a clearer screenshot." },
      { status: 413 },
    );
  }

  const prompt = `You are extracting metrics from an InBody body-composition RESULT SHEET for FORMA.

The image is often an InBody 270 Result Sheet (or similar): dense layout with left analysis blocks, a middle history graph, and a right summary panel. It may also be a phone screenshot of results.

## Which values to take (CURRENT scan only)
Prefer these sections — use the bold/main measured value beside each label, NOT the normal-range numbers in parentheses:

1. Muscle-Fat Analysis → Weight (kg), SMM / Skeletal Muscle Mass (kg), Body Fat Mass (kg)
2. Obesity Analysis → BMI, PBF / Percent Body Fat (%)
3. Right summary / Research Parameters → Visceral Fat Level, Fat Free Mass (kg), Basal Metabolic Rate / BMR (kcal)
4. Header → Test Date / Time

Map Fat Free Mass → leanBodyMassKg.
Map SMM → skeletalMuscleMassKg.
Map PBF → bodyFatPercent.
Map Visceral Fat Level → visceralFatLevel (the level number like 5, not a kg value).

## IGNORE completely
- Body Composition History timeline / graph (all older dates and the middle values on those rows). If a history row ends with the latest value, you may use ONLY the rightmost value when the main section is unreadable — prefer Muscle-Fat / Obesity sections first.
- Normal ranges in parentheses (e.g. 18.5–25.0, 28.8–35.2)
- Segmental Lean / Segmental Fat (arms, trunk, legs)
- Impedance tables, calorie expenditure of exercise lists
- Weight Control / Target Weight / Fat Control / Muscle Control (unless Weight itself is missing elsewhere)
- InBody Score points

## Date
Test Date may look like "2026.07.22. 08:30" or "26.07.22." → return "YYYY-MM-DD" (e.g. 2026-07-22). Empty string if unknown.

## Units
Prefer kg / %. If only lb is shown, convert to kg (÷ 2.205) and round to 1 decimal.

Respond with ONLY valid JSON:
{
  "date": "YYYY-MM-DD or empty string",
  "weightKg": number or null,
  "skeletalMuscleMassKg": number or null,
  "bodyFatMassKg": number or null,
  "bodyFatPercent": number or null,
  "leanBodyMassKg": number or null,
  "visceralFatLevel": number or null,
  "bmi": number or null,
  "bmrKcal": number or null,
  "notes": "brief note if ambiguous",
  "confidence": "high" | "medium" | "low"
}
Use null when not visible. Do not invent numbers.`;

  try {
    const model =
      process.env.OPENAI_INBODY_MODEL?.trim() ||
      process.env.OPENAI_MEAL_MODEL?.trim() ||
      "gpt-4o";

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: image, detail: "high" },
              },
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

    // Alias fields models sometimes emit for InBody labels.
    const pick = (...keys: string[]): unknown => {
      for (const key of keys) {
        if (parsed[key] !== undefined && parsed[key] !== null && parsed[key] !== "") {
          return parsed[key];
        }
      }
      return null;
    };

    const date = normalizeInBodyDate(
      typeof parsed.date === "string"
        ? parsed.date
        : typeof parsed.testDate === "string"
          ? parsed.testDate
          : "",
    );

    let weightKg = numOrNull(pick("weightKg", "weight"));
    let skeletalMuscleMassKg = numOrNull(
      pick("skeletalMuscleMassKg", "smm", "SMM", "skeletalMuscleMass"),
    );
    let bodyFatMassKg = numOrNull(pick("bodyFatMassKg", "bodyFatMass", "BFM"));
    let bodyFatPercent = numOrNull(pick("bodyFatPercent", "pbf", "PBF", "percentBodyFat"));
    let leanBodyMassKg = numOrNull(
      pick("leanBodyMassKg", "fatFreeMassKg", "fatFreeMass", "FFM", "softLeanMassKg"),
    );
    let visceralFatLevel = numOrNull(pick("visceralFatLevel", "vfl", "VFL", "visceralFat"));
    let bmi = numOrNull(pick("bmi", "BMI"));
    const bmrRaw = numOrNull(pick("bmrKcal", "bmr", "BMR", "basalMetabolicRate"));
    const bmrKcal = bmrRaw !== null ? Math.round(bmrRaw) : null;

    // Soft sanity: if PBF missing but mass + weight present, derive once.
    if (
      bodyFatPercent === null &&
      bodyFatMassKg !== null &&
      weightKg !== null &&
      weightKg > 0
    ) {
      bodyFatPercent = Math.round((bodyFatMassKg / weightKg) * 1000) / 10;
    }

    // Visceral fat level on InBody is typically 1–20 (not kg).
    if (visceralFatLevel !== null && visceralFatLevel > 30) {
      visceralFatLevel = null;
    }

    return NextResponse.json({
      date,
      weightKg,
      skeletalMuscleMassKg,
      bodyFatMassKg,
      bodyFatPercent,
      leanBodyMassKg,
      visceralFatLevel,
      bmi,
      bmrKcal,
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      confidence:
        parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
          ? parsed.confidence
          : "medium",
      model,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}

/** Accept InBody header dates like 2026.07.22. 08:30 or 26.07.22. */
function normalizeInBodyDate(raw: string): string {
  const text = raw.trim();
  if (!text) return "";
  const iso = text.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const short = text.match(/(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (short) {
    const [, yy, m, d] = short;
    const year = Number(yy) >= 70 ? `19${yy}` : `20${yy}`;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const already = text.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(already) ? already : "";
}
