/**
 * Persistence guards: empty client state must not wipe server history.
 * Run: node scripts/cloud-persist-guard-test.cjs
 */

function keepExistingIfIncomingEmpty(incoming, existing, allowEmpty) {
  const next = Array.isArray(incoming) ? incoming : [];
  const prior = Array.isArray(existing) ? existing : [];
  if (allowEmpty) return next;
  if (next.length === 0 && prior.length > 0) return prior;
  return next;
}

function mergeHistories(local, cloud) {
  const byId = new Map();
  const prefer = (a, b) => {
    const count = (session) =>
      session.exercises.reduce(
        (n, ex) => n + ex.sets.filter((set) => set.complete || set.skipped).length,
        0,
      );
    const aSets = count(a);
    const bSets = count(b);
    if (aSets !== bSets) return aSets > bSets ? a : b;
    return a.completedAt >= b.completedAt ? a : b;
  };
  for (const session of [...cloud, ...local]) {
    if (!session?.id) continue;
    const existing = byId.get(session.id);
    byId.set(session.id, existing ? prefer(existing, session) : session);
  }
  return Array.from(byId.values()).sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function cloudMemberNeedsCrackerOnboarding(cloud, seasonActive = true) {
  if (!seasonActive) return false;
  if (cloud.profile?.club) return false;
  const hasCheckIns = Object.values(cloud.crackerMoveCheckIns || {}).some(
    (entry) => entry && typeof entry === "object" && Object.keys(entry).length > 0,
  );
  return (
    cloud.history.length === 0 &&
    cloud.workouts.length === 0 &&
    cloud.progress.length === 0 &&
    !cloud.sessionDraft &&
    !hasCheckIns
  );
}

function session(id, extra = {}) {
  return {
    id,
    workoutId: "w1",
    workoutTitle: "Upper Body",
    completedAt: extra.completedAt || "2026-10-01T00:00:00.000Z",
    exercises: extra.exercises || [
      { sets: [{ reps: 8, weight: 40, rpe: 7, complete: true }] },
    ],
    ...extra,
  };
}

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

check("empty incoming history does not overwrite server history", () => {
  const kept = keepExistingIfIncomingEmpty([], [session("a")], false);
  if (kept.length !== 1 || kept[0].id !== "a") throw new Error("server history was dropped");
});

check("explicit empty reset is allowed", () => {
  const kept = keepExistingIfIncomingEmpty([], [session("a")], true);
  if (kept.length !== 0) throw new Error("reset should clear");
});

check("non-empty incoming wins", () => {
  const kept = keepExistingIfIncomingEmpty([session("b")], [session("a")], false);
  if (kept.length !== 1 || kept[0].id !== "b") throw new Error("incoming should win");
});

check("login merge unions local + cloud sessions", () => {
  const merged = mergeHistories([session("local")], [session("cloud")]);
  const ids = merged.map((item) => item.id).sort().join(",");
  if (ids !== "cloud,local") throw new Error(ids);
});

check("richer session copy is kept on id clash", () => {
  const thin = session("same", {
    exercises: [{ sets: [{ reps: 0, weight: 0, rpe: 0, complete: false }] }],
  });
  const rich = session("same");
  const merged = mergeHistories([thin], [rich]);
  if (merged.length !== 1 || !merged[0].exercises[0].sets[0].complete) {
    throw new Error("richer copy lost");
  }
});

check("returning member with club is not sent through onboarding", () => {
  const needs = cloudMemberNeedsCrackerOnboarding({
    profile: { club: "fremantle" },
    history: [],
    workouts: [],
    progress: [],
    sessionDraft: null,
    crackerMoveCheckIns: {},
  });
  if (needs) throw new Error("club member re-onboarded");
});

check("stub account with no club and no data still onboards", () => {
  const needs = cloudMemberNeedsCrackerOnboarding({
    profile: { club: "", firstName: "Jess" },
    history: [],
    workouts: [],
    progress: [],
    sessionDraft: null,
    crackerMoveCheckIns: {},
  });
  if (!needs) throw new Error("stub should onboard");
});

check("history on the account skips onboarding even without club", () => {
  const needs = cloudMemberNeedsCrackerOnboarding({
    profile: { club: "" },
    history: [{}],
    workouts: [],
    progress: [],
    sessionDraft: null,
    crackerMoveCheckIns: {},
  });
  if (needs) throw new Error("history should skip onboarding");
});

console.log(`\n${passed} checks passed`);
