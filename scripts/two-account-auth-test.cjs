/**
 * Two-account Auth / RLS / isolation test.
 * Uses only NEXT_PUBLIC_SUPABASE_URL + publishable (preferred) or anon key.
 * Never reads or requires SUPABASE_SERVICE_ROLE_KEY.
 *
 * Run: node scripts/two-account-auth-test.cjs
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const OUT_DIR = process.env.QA_OUT || "/opt/cursor/artifacts";
fs.mkdirSync(OUT_DIR, { recursive: true });

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const publishable = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const key = publishable || anon;
const hasServiceRole = Object.prototype.hasOwnProperty.call(process.env, "SUPABASE_SERVICE_ROLE_KEY");

function makeClient() {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

const stamp = Date.now().toString(36);
const password = `FormaQa!${stamp}Aa`;
const userA = {
  email: process.env.QA_USER_A_EMAIL || `forma.qa.a.${stamp}@mailinator.com`,
  firstName: "UserA",
  password: process.env.QA_USER_A_PASSWORD || password,
  reuse: Boolean(process.env.QA_USER_A_EMAIL),
};
const userB = {
  email: process.env.QA_USER_B_EMAIL || `forma.qa.b.${stamp}@mailinator.com`,
  firstName: "UserB",
  password: process.env.QA_USER_B_PASSWORD || password,
  reuse: Boolean(process.env.QA_USER_B_EMAIL),
};

const report = {
  startedAt: new Date().toISOString(),
  env: {
    hasUrl: Boolean(url),
    urlHost: (() => {
      try {
        return new URL(url).host;
      } catch {
        return "invalid";
      }
    })(),
    hasPublishableKey: Boolean(publishable),
    hasAnonKey: Boolean(anon),
    keyUsed: publishable ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : anon ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : "none",
    hasServiceRole: hasServiceRole,
    serviceRoleUsed: false,
  },
  accounts: {
    a: { email: userA.email, id: null, confirmed: false, sessionOnSignup: false },
    b: { email: userB.email, id: null, confirmed: false, sessionOnSignup: false },
  },
  results: {},
  issues: [],
  notes: [],
};

function pass(area) {
  report.results[area] = "PASS";
}
function fail(area, detail) {
  report.results[area] = "FAIL";
  report.issues.push({ severity: "CRITICAL", area, detail });
}
function blocked(area, detail) {
  report.results[area] = "BLOCKED";
  report.issues.push({ severity: "HIGH", area, detail });
}

function profilePayload(id, email, firstName, experienceLevel) {
  return {
    id,
    first_name: firstName,
    email,
    profile_photo: "",
    age: null,
    height: null,
    weight: null,
    gender: "female",
    goal: "fitness",
    experience_level: experienceLevel,
    training_days: 3,
    equipment_access: "full_gym",
    workout_location: "gym",
    preferred_training_style: "strength",
    injuries: "",
    limitations: "",
    lifestyle: "",
    sleep_average: null,
    daily_steps: null,
    nutrition_goal: "maintain",
    club: "fremantle",
    updated_at: new Date().toISOString(),
  };
}

async function upsertProfile(client, payload) {
  const first = await client.from("profiles").upsert(payload);
  if (!first.error) return first;
  if (/club/i.test(first.error.message || "")) {
    report.notes.push("Live profiles table has no club column; retried upsert without it.");
    const { club: _club, ...withoutClub } = payload;
    return client.from("profiles").upsert(withoutClub);
  }
  return first;
}

function statePayload(userId, { level, historyId, fitnessReps, inbodyFat }) {
  return {
    user_id: userId,
    workouts: [
      {
        id: `qa-${level}-wod`,
        title: `${level} Cracker session`,
        exercises: [{ id: "ex-1", name: "Goblet Squat", sets: 3 }],
      },
    ],
    history: [
      {
        id: historyId,
        workoutId: `qa-${level}-wod`,
        workoutTitle: `${level} Cracker session`,
        completedAt: new Date().toISOString(),
        crackerLevel: level,
        exercises: [
          {
            exerciseId: "ex-1",
            name: "Goblet Squat",
            sets: [{ reps: 10, weight: 16, rpe: 7, complete: true }],
          },
        ],
      },
    ],
    programme: {
      week: 1,
      programId: "christmas-cracker",
      schemaVersion: 1,
      alignActive: false,
      crackerMoveCheckIns: {
        fitness_initial: {
          deadliftVariation: "barbell",
          deadliftLoadKg: 40,
          deadliftReps: fitnessReps,
          cardio500Mode: "row",
          cardio500Seconds: 138,
          pushupReps: 12,
          situpReps: 25,
          gymConfidence: 5,
        },
        inbody_initial: {
          skeletalMuscleMassKg: 24.8,
          bodyFatPercent: inbodyFat,
          visceralFat: 6,
        },
      },
    },
    progress: [],
    photos: [],
    water: {},
    journal: {},
    session_draft: {
      workoutId: `qa-${level}-wod`,
      note: `partial ${level} workout`,
    },
    updated_at: new Date().toISOString(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, attempts = 6) {
  let lastErr = "unknown";
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      lastErr = "429";
      await sleep(2500 * (i + 1));
      continue;
    }
    if (!res.ok) {
      lastErr = String(res.status);
      await sleep(1000);
      continue;
    }
    return res.json();
  }
  throw new Error(`fetch ${url} failed: ${lastErr}`);
}

function mailinatorInbox(email) {
  return email.split("@")[0];
}

async function waitForVerifyLink(email, timeoutMs = 90000) {
  const inbox = mailinatorInbox(email);
  const started = Date.now();
  let lastErr = "no mail yet";
  while (Date.now() - started < timeoutMs) {
    try {
      const list = await fetchJson(
        `https://api.mailinator.com/api/v2/domains/public/inboxes/${encodeURIComponent(inbox)}`,
      );
      const msg = (list.msgs || []).find((m) => /confirm/i.test(m.subject || "")) || (list.msgs || [])[0];
      if (msg?.id) {
        const full = await fetchJson(
          `https://api.mailinator.com/api/v2/domains/public/messages/${encodeURIComponent(msg.id)}`,
        );
        const body = (full.parts || []).map((p) => p.body || "").join("\n");
        const raw = (body.match(/https?:\/\/[^\s"'<>]+/g) || []).find((u) =>
          u.includes("/auth/v1/verify"),
        );
        if (raw) return raw.replace(/&amp;/g, "&");
        lastErr = "message found but no verify link";
      } else {
        lastErr = "inbox empty";
      }
    } catch (err) {
      lastErr = String(err.message || err);
    }
    await sleep(4000);
  }
  throw new Error(`confirmation email not found for ${inbox}: ${lastErr}`);
}

async function confirmEmail(email) {
  const verifyUrl = await waitForVerifyLink(email);
  const parsed = new URL(verifyUrl);
  if (!parsed.pathname.includes("/auth/v1/verify") || parsed.searchParams.get("type") !== "signup") {
    throw new Error("unexpected verify URL shape");
  }
  const res = await fetch(verifyUrl, { redirect: "manual" });
  if (res.status >= 400) {
    throw new Error(`verify link returned ${res.status}`);
  }
  report.notes.push(`Confirmed ${mailinatorInbox(email)} via signup verify link (HTTP ${res.status}).`);
}

async function signInExisting(label, creds) {
  const client = makeClient();
  const signed = await client.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  });
  if (signed.error || !signed.data.session) {
    return { client, error: signed.error?.message || "no session", session: null, user: null };
  }
  report.notes.push(`${label} reused existing account id=${signed.data.user.id.slice(0, 8)}…`);
  return { client, error: null, session: signed.data.session, user: signed.data.user };
}

async function createAccount(label, creds) {
  if (creds.reuse) return signInExisting(label, creds);
  const client = makeClient();
  let error = null;
  let data = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const result = await client.auth.signUp({
      email: creds.email,
      password: creds.password,
      options: { data: { first_name: creds.firstName } },
    });
    error = result.error;
    data = result.data;
    if (!error) break;
    if (!/rate.?limit|too many|after \d+ seconds/i.test(error.message || "")) break;
    const wait = 180000;
    report.notes.push(`${label} signup rate-limited; waiting ${wait / 1000}s (attempt ${attempt + 1})`);
    await sleep(wait);
  }
  if (error) {
    return { client, error: error.message, session: null, user: null };
  }
  let session = data.session;
  let user = data.user;
  if (session) {
    report.notes.push(`${label} signup returned a session immediately (confirm-email off).`);
    if (label === "USER A") report.accounts.a.sessionOnSignup = true;
    if (label === "USER B") report.accounts.b.sessionOnSignup = true;
  }
  if (!session) {
    report.notes.push(`${label} signup had no session; attempting email confirm (confirm-email may still be on).`);
    try {
      await confirmEmail(creds.email);
    } catch (err) {
      return {
        client,
        error: `signup ok but email confirm failed: ${err.message}`,
        session: null,
        user,
        needsConfirm: true,
      };
    }
    const signed = await client.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    });
    if (signed.error) {
      return {
        client,
        error: `confirmed but sign-in failed: ${signed.error.message}`,
        session: null,
        user,
        needsConfirm: false,
      };
    }
    session = signed.data.session;
    user = signed.data.user;
  }
  report.notes.push(`${label} created id=${user?.id?.slice(0, 8)}… session=${Boolean(session)}`);
  return { client, error: null, session, user, needsConfirm: !session };
}

async function main() {
  if (!url || !key) {
    fail("SUPABASE CLIENT CONFIG", "Missing NEXT_PUBLIC_SUPABASE_URL or browser key");
    return;
  }
  if (hasServiceRole) {
    report.notes.push("SUPABASE_SERVICE_ROLE_KEY is set in the environment; this test does not use it.");
  }
  pass("SUPABASE CLIENT CONFIG");

  const a = await createAccount("USER A", userA);
  if (a.error || !a.session || !a.user) {
    fail("ACCOUNT CREATION", `User A: ${a.error || "no session after signup"}`);
    fail("LOGIN", "Blocked by account creation");
    return;
  }
  report.accounts.a.id = a.user.id;
  report.accounts.a.confirmed = true;
  pass("ACCOUNT CREATION");
  pass("LOGIN");

  const aProfile = await upsertProfile(
    a.client,
    profilePayload(a.user.id, userA.email, "UserA", "beginner"),
  );
  if (aProfile.error) {
    fail("PROFILE SYNC", aProfile.error.message);
  } else {
    const pulled = await a.client.from("profiles").select("first_name,experience_level,email").eq("id", a.user.id).maybeSingle();
    if (pulled.data?.experience_level === "beginner" && pulled.data?.first_name === "UserA") {
      pass("PROFILE SYNC");
    } else {
      fail("PROFILE SYNC", `Unexpected profile: ${JSON.stringify(pulled)}`);
    }
  }

  const aState = await a.client.from("user_state").upsert(
    statePayload(a.user.id, {
      level: "beginner",
      historyId: "qa-a-session",
      fitnessReps: 12,
      inbodyFat: 28.2,
    }),
  );
  if (aState.error) {
    fail("WORKOUT SYNC", aState.error.message);
    fail("FITNESS SYNC", aState.error.message);
    fail("INBODY SYNC", aState.error.message);
  } else {
    const pulled = await a.client.from("user_state").select("history,programme,session_draft").eq("user_id", a.user.id).maybeSingle();
    const hist = pulled.data?.history || [];
    const checkins = pulled.data?.programme?.crackerMoveCheckIns || {};
    if (hist[0]?.crackerLevel === "beginner" && hist[0]?.id === "qa-a-session") pass("WORKOUT SYNC");
    else fail("WORKOUT SYNC", JSON.stringify(pulled.error || hist[0]));
    if (checkins.fitness_initial?.deadliftReps === 12) pass("FITNESS SYNC");
    else fail("FITNESS SYNC", JSON.stringify(checkins.fitness_initial || pulled.error));
    if (checkins.inbody_initial?.bodyFatPercent === 28.2) pass("INBODY SYNC");
    else fail("INBODY SYNC", JSON.stringify(checkins.inbody_initial || pulled.error));
  }

  const signedOutA = await a.client.auth.signOut();
  if (signedOutA.error) fail("LOGOUT", signedOutA.error.message);
  else {
    const { data: afterOut } = await a.client.auth.getSession();
    if (afterOut.session) fail("LOGOUT", "Session still present after signOut");
    else pass("LOGOUT");
  }

  // Avoid Auth email + Mailinator public-inbox rate limits between accounts.
  await sleep(12000);

  const b = await createAccount("USER B", userB);
  if (b.error || !b.session || !b.user) {
    fail("ACCOUNT CREATION", `User B: ${b.error || "no session"}`);
    fail("TWO-USER ISOLATION", "Could not create second account");
    fail("RLS", "Could not create second account");
    return;
  }
  report.accounts.b.id = b.user.id;
  report.accounts.b.confirmed = true;
  if (b.user.id === a.user.id) {
    fail("TWO-USER ISOLATION", "User A and User B resolved to the same auth id");
    return;
  }

  const bSeesAProfile = await b.client.from("profiles").select("id,first_name,email").eq("id", a.user.id);
  const bSeesAState = await b.client.from("user_state").select("user_id,history,programme").eq("user_id", a.user.id);
  const bAllProfiles = await b.client.from("profiles").select("id,first_name");
  const bAllState = await b.client.from("user_state").select("user_id");

  const leakedProfile = (bSeesAProfile.data || []).length > 0 || (bAllProfiles.data || []).some((row) => row.id === a.user.id);
  const leakedState = (bSeesAState.data || []).length > 0 || (bAllState.data || []).some((row) => row.user_id === a.user.id);

  report.notes.push(
    `B profiles visible=${(bAllProfiles.data || []).length} A-leak=${leakedProfile}; B state visible=${(bAllState.data || []).length} A-leak=${leakedState}`,
  );

  if (bSeesAProfile.error && /row-level|permission|rls/i.test(bSeesAProfile.error.message)) {
    report.notes.push(`B profile query error (expected under RLS): ${bSeesAProfile.error.message}`);
  }
  if (bSeesAState.error && /row-level|permission|rls/i.test(bSeesAState.error.message)) {
    report.notes.push(`B state query error (expected under RLS): ${bSeesAState.error.message}`);
  }

  const steal = await b.client.from("user_state").upsert(
    statePayload(a.user.id, {
      level: "intermediate",
      historyId: "qa-stolen",
      fitnessReps: 99,
      inbodyFat: 9.9,
    }),
  );
  const stealProfile = await b.client
    .from("profiles")
    .update({ first_name: "Hacked" })
    .eq("id", a.user.id)
    .select();

  const stealBlocked = Boolean(steal.error) || (steal.data && steal.data.length === 0);
  const stealProfileBlocked =
    Boolean(stealProfile.error) || !stealProfile.data || stealProfile.data.length === 0;

  if (leakedProfile || leakedState) {
    fail(
      "TWO-USER ISOLATION",
      `User B could read User A data. profiles=${JSON.stringify(bSeesAProfile.data)} state=${JSON.stringify(bSeesAState.data)}`,
    );
    fail("RLS", "Select isolation failed");
  } else if (!stealBlocked || !stealProfileBlocked) {
    fail(
      "RLS",
      `User B wrote User A rows. stateErr=${steal.error?.message || "none"} profile=${JSON.stringify(stealProfile.data)}`,
    );
    fail("TWO-USER ISOLATION", "Cross-account write succeeded");
  } else {
    pass("TWO-USER ISOLATION");
    pass("RLS");
  }

  const bOwn = await upsertProfile(
    b.client,
    profilePayload(b.user.id, userB.email, "UserB", "intermediate"),
  );
  const bState = await b.client.from("user_state").upsert(
    statePayload(b.user.id, {
      level: "intermediate",
      historyId: "qa-b-session",
      fitnessReps: 18,
      inbodyFat: 22.1,
    }),
  );
  if (bOwn.error || bState.error) {
    fail("PROFILE SYNC", `User B write: ${bOwn.error?.message || bState.error?.message}`);
  }

  await b.client.auth.signOut();

  const a2 = makeClient();
  const relogin = await a2.auth.signInWithPassword({
    email: userA.email,
    password: userA.password,
  });
  if (relogin.error || !relogin.data.session) {
    fail("LOGIN", `User A re-login: ${relogin.error?.message || "no session"}`);
    return;
  }

  const restoredProfile = await a2.from("profiles").select("first_name,experience_level").eq("id", a.user.id).maybeSingle();
  const restoredState = await a2
    .from("user_state")
    .select("history,programme,session_draft")
    .eq("user_id", a.user.id)
    .maybeSingle();
  const aSeesB = await a2.from("user_state").select("user_id,history").eq("user_id", b.user.id);

  const aOk =
    restoredProfile.data?.first_name === "UserA" &&
    restoredProfile.data?.experience_level === "beginner" &&
    restoredState.data?.history?.[0]?.id === "qa-a-session" &&
    restoredState.data?.history?.[0]?.crackerLevel === "beginner" &&
    restoredState.data?.programme?.crackerMoveCheckIns?.fitness_initial?.deadliftReps === 12 &&
    restoredState.data?.programme?.crackerMoveCheckIns?.inbody_initial?.bodyFatPercent === 28.2 &&
    restoredState.data?.history?.[0]?.id !== "qa-stolen";

  const bNotVisible = !(aSeesB.data && aSeesB.data.length > 0);

  if (aOk && bNotVisible) {
    pass("ACCOUNT RESTORE");
    report.notes.push("User A login restored Beginner + fitness/InBody; User B rows not visible.");
  } else {
    fail(
      "ACCOUNT RESTORE",
      JSON.stringify({
        restoredProfile: restoredProfile.data || restoredProfile.error,
        restoredState: restoredState.data || restoredState.error,
        aSeesB: aSeesB.data || aSeesB.error,
      }),
    );
  }

  await a2.auth.signOut();
}

main()
  .catch((err) => {
    fail("QA_RUNNER", String(err && err.stack ? err.stack : err));
  })
  .finally(() => {
    report.finishedAt = new Date().toISOString();
    const json = JSON.stringify(report, null, 2);
    console.log(json);
    for (const outPath of [
      path.join(OUT_DIR, "two_account_auth_report.json"),
      path.join("/tmp", "two_account_auth_report.json"),
    ]) {
      try {
        fs.writeFileSync(outPath, json);
      } catch (err) {
        console.error(`write failed ${outPath}: ${err.message}`);
      }
    }
    const failed = Object.values(report.results).some((v) => v === "FAIL" || v === "BLOCKED");
    process.exit(failed ? 1 : 0);
  });
