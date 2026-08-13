import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { computeStreak, totalCompletedSets, weekSessionCount } from "@/lib/analytics";
import type { WorkoutSession } from "@/lib/types";
import type { ProgressEntry } from "@/lib/progress";
import type { InBodyState } from "@/lib/inbody";
import { CLUB_LABELS, GENDER_LABELS, type LifeSoulClub } from "@/lib/user";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
  first_name: string;
  email: string;
  gender: string;
  goal: string;
  club: string;
  weight: number | null;
  created_at: string;
};

type StateRow = {
  user_id: string;
  history: WorkoutSession[];
  progress: ProgressEntry[];
  programme: { inbody?: InBodyState };
};

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

/**
 * Coach export — all members' challenge summaries in one CSV.
 * Requires SUPABASE_SERVICE_ROLE_KEY and ADMIN_EXPORT_SECRET.
 *
 * curl -H "Authorization: Bearer YOUR_SECRET" https://your-app.vercel.app/api/admin/challenge-export
 */
export async function GET(request: Request) {
  const secret = process.env.ADMIN_EXPORT_SECRET?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!secret || !serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Admin export is not configured. Set SUPABASE_SERVICE_ROLE_KEY and ADMIN_EXPORT_SECRET." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: profiles, error: profileError }, { data: states, error: stateError }] = await Promise.all([
    supabase.from("profiles").select("id, first_name, email, gender, goal, club, weight, created_at"),
    supabase.from("user_state").select("user_id, history, progress, programme"),
  ]);

  if (profileError || stateError) {
    return NextResponse.json(
      { error: profileError?.message ?? stateError?.message ?? "Export failed." },
      { status: 500 },
    );
  }

  const stateByUser = new Map((states as StateRow[]).map((s) => [s.user_id, s]));
  const exportDate = new Date().toISOString().slice(0, 10);

  const header = [
    "exportDate",
    "firstName",
    "email",
    "club",
    "gender",
    "goal",
    "sessionsCompleted",
    "totalSetsCompleted",
    "currentStreakDays",
    "sessionsThisWeek",
    "startWeightKg",
    "latestWeightKg",
    "weightChangeKg",
    "latestBodyFatPercent",
    "latestSkeletalMuscleKg",
    "latestInBodyDate",
    "memberSince",
  ];

  const csvRows = [header.join(",")];

  for (const row of (profiles as ProfileRow[]) ?? []) {
    const state = stateByUser.get(row.id);
    const history = state?.history ?? [];
    const progress = state?.progress ?? [];
    const inbody: InBodyState = state?.programme?.inbody ?? { scans: [] };
    const sortedProgress = [...progress].sort((a, b) => a.date.localeCompare(b.date));
    const startWeight = sortedProgress.find((e) => e.weight != null)?.weight ?? row.weight;
    const latestWeight = [...sortedProgress].reverse().find((e) => e.weight != null)?.weight ?? row.weight;
    const weightChange =
      startWeight != null && latestWeight != null ? Number((latestWeight - startWeight).toFixed(2)) : "";
    const latestInBody = [...(inbody.scans ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0];
    const clubLabel = row.club ? (CLUB_LABELS[row.club as LifeSoulClub] ?? row.club) : "";

    csvRows.push(
      [
        exportDate,
        row.first_name,
        row.email,
        clubLabel,
        GENDER_LABELS[row.gender as keyof typeof GENDER_LABELS] ?? row.gender,
        row.goal,
        history.length,
        totalCompletedSets(history),
        computeStreak(history),
        weekSessionCount(history),
        startWeight ?? "",
        latestWeight ?? "",
        weightChange,
        latestInBody?.bodyFatPercent ?? "",
        latestInBody?.skeletalMuscleMassKg ?? "",
        latestInBody?.date?.slice(0, 10) ?? "",
        row.created_at.slice(0, 10),
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  return new NextResponse(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="life-and-soul-challenge-all-${exportDate}.csv"`,
    },
  });
}
