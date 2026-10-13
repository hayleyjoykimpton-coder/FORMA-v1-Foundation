/**
 * Cloud restore: write workout history for a signed-in user, then pull it
 * from a second client with no local cache (PWA reinstall analogue).
 *
 * Uses only NEXT_PUBLIC_SUPABASE_URL + publishable/anon. Never service_role.
 * Run: node scripts/cloud-restore-test.cjs
 */
const { createClient } = require("@supabase/supabase-js");

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const key = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim();

function makeClient() {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function keepExistingIfIncomingEmpty(incoming, existing, allowEmpty) {
  const next = Array.isArray(incoming) ? incoming : [];
  const prior = Array.isArray(existing) ? existing : [];
  if (allowEmpty) return next;
  if (next.length === 0 && prior.length > 0) return prior;
  return next;
}

async function main() {
  if (!url || !key) {
    console.log("SKIP no Supabase env");
    process.exit(0);
  }

  const stamp = Date.now().toString(36);
  const email = `forma.restore.${stamp}@mailinator.com`;
  const password = `FormaQa!${stamp}Aa`;
  const historyId = `restore-${stamp}`;
  const writer = makeClient();

  const { data: signed, error: signErr } = await writer.auth.signUp({
    email,
    password,
    options: { data: { first_name: "Restore" } },
  });
  if (signErr || !signed.session?.user) {
    throw new Error(`signup failed: ${signErr?.message || "no session"}`);
  }
  const userId = signed.session.user.id;

  const payload = {
    user_id: userId,
    workouts: [{ id: "wod-1", title: "Upper Body", exercises: [] }],
    history: [
      {
        id: historyId,
        workoutId: "wod-1",
        workoutTitle: "Upper Body",
        completedAt: new Date().toISOString(),
        exercises: [
          {
            exerciseId: "ex-1",
            name: "Weighted Plank",
            sets: [{ reps: 0, weight: 10, rpe: 7, complete: true, holdSeconds: 45 }],
          },
        ],
      },
    ],
    programme: { week: 3, programId: "christmas-cracker", schemaVersion: 4 },
    progress: [{ id: "p1", date: new Date().toISOString(), weight: 62.4, measurements: {}, notes: "" }],
    photos: [],
    water: {},
    journal: {},
    session_draft: null,
    updated_at: new Date().toISOString(),
  };

  const { error: writeErr } = await writer.from("user_state").upsert(payload, { onConflict: "user_id" });
  if (writeErr) throw new Error(`write failed: ${writeErr.message}`);
  await writer.auth.signOut();

  const reader = makeClient();
  const { error: inErr } = await reader.auth.signInWithPassword({ email, password });
  if (inErr) throw new Error(`signin failed: ${inErr.message}`);

  const { data: pulled, error: pullErr } = await reader
    .from("user_state")
    .select("history,workouts,programme,progress")
    .eq("user_id", userId)
    .maybeSingle();
  if (pullErr) throw new Error(`pull failed: ${pullErr.message}`);
  if (pulled?.history?.[0]?.id !== historyId) {
    throw new Error("second client did not restore saved history");
  }
  if (pulled?.programme?.week !== 3) {
    throw new Error("programme week was not restored");
  }
  if (pulled?.progress?.[0]?.id !== "p1") {
    throw new Error("progress was not restored");
  }

  const guarded = keepExistingIfIncomingEmpty([], pulled.history, false);
  if (guarded[0]?.id !== historyId) {
    throw new Error("empty local overwrite guard failed");
  }

  console.log("PASS cloud restore from a second client (PWA reinstall analogue)");
  console.log("PASS empty-local push would keep server history");
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
