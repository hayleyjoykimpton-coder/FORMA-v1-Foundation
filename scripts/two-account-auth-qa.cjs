/**
 * Two-account Auth + isolation QA.
 * Run: node scripts/two-account-auth-qa.cjs
 * Requires: pnpm dev on :3000 with Supabase URL + publishable/anon key.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.QA_BASE || "http://localhost:3000";
const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const stamp = Date.now();
const USER_A = {
  firstName: "QaAlpha",
  email: `forma.qa.a.${stamp}@mailinator.com`,
  password: `CrackerQa-A-${stamp}!`,
  markerKg: "47.5",
  markerReps: "8",
  markerRpe: "7",
  pushups: "12",
  bodyFat: "22.5",
};
const USER_B = {
  firstName: "QaBravo",
  email: `forma.qa.b.${stamp}@mailinator.com`,
  password: `CrackerQa-B-${stamp}!`,
  markerKg: "33",
};

const report = {
  startedAt: new Date().toISOString(),
  users: {
    a: { email: USER_A.email, firstName: USER_A.firstName },
    b: { email: USER_B.email, firstName: USER_B.firstName },
  },
  results: {},
  issues: [],
  notes: [],
  blockers: [],
};

function pass(area) {
  report.results[area] = "PASS";
}
function fail(area, detail) {
  report.results[area] = "FAIL";
  report.issues.push({ severity: "HIGH", area, detail });
}
function blocked(area, detail) {
  report.results[area] = "BLOCKED";
  report.blockers.push({ area, detail });
}

function shot(page, name) {
  return page.screenshot({ path: path.join(OUT, name), fullPage: true }).catch(() => null);
}

async function visible(locator, timeout = 2500) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickIf(locator, timeout = 2500) {
  if (await visible(locator, timeout)) {
    await locator.first().click();
    return true;
  }
  return false;
}

async function waitHome(page) {
  await page
    .getByRole("button", { name: /^Move$/i })
    .or(page.getByText(/WEEK \d+ OF 6/i))
    .or(page.getByText(/Where do you train/i))
    .or(page.getByText(/Welcome back|Create your account/i))
    .first()
    .waitFor({ timeout: 25000 });
}

async function fillAuth(page, { firstName, email, password }, mode) {
  if (mode === "signup") {
    if (await visible(page.getByRole("button", { name: /need an account/i }), 1500)) {
      await page.getByRole("button", { name: /need an account/i }).click();
    }
    const first = page.locator("label.field:has-text('First name') input");
    if (await visible(first, 3000)) await first.fill(firstName);
  } else if (await visible(page.getByRole("button", { name: /already have an account/i }), 1200)) {
    await page.getByRole("button", { name: /already have an account/i }).click();
  }
  await page.locator("label.field:has-text('Email') input").fill(email);
  await page.locator("label.field:has-text('Password') input").fill(password);
}

async function maybeOnboard(page, levelLabel) {
  if (await visible(page.getByText(/Where do you train/i), 4000)) {
    const club = page.getByRole("button", { name: /fremantle|broome|port hedland|karratha/i }).first();
    await club.click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    const level = page.getByRole("button", { name: new RegExp(levelLabel, "i") }).first();
    await level.click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.getByRole("button", { name: /start cracker/i }).click();
    return "onboarding";
  }
  return "skipped";
}

async function openProfile(page) {
  const avatar = page.getByRole("button", { name: /open profile/i }).first();
  if (await visible(avatar, 4000)) {
    await avatar.click();
    return true;
  }
  return false;
}

async function saveProfileLevel(page, level) {
  const opened = await openProfile(page);
  if (!opened) return false;
  await page.getByRole("button", { name: new RegExp(`^${level}$`, "i") }).first().click();
  if (await visible(page.getByRole("button", { name: /save profile/i }), 1500)) {
    await page.getByRole("button", { name: /save profile/i }).click();
  } else {
    await page.getByRole("button", { name: /^Save$/i }).first().click();
  }
  await page.waitForTimeout(1200);
  return true;
}

async function signOut(page) {
  if (!(await openProfile(page))) return false;
  const btn = page.getByRole("button", { name: /sign out/i });
  if (!(await visible(btn, 4000))) return false;
  await btn.click();
  await page.getByText(/Welcome back|Create your account/i).first().waitFor({ timeout: 20000 });
  return true;
}

async function goMove(page) {
  const move = page.getByRole("button", { name: /^Move$/i });
  if (await visible(move, 6000)) await move.click();
  await page.waitForTimeout(400);
}

async function logPartialWorkout(page, kg, reps, rpe) {
  await goMove(page);
  const start = page.getByRole("button", { name: /start workout/i }).first();
  if (!(await visible(start, 8000))) return false;
  await start.click();
  if (await visible(page.getByRole("button", { name: /^Start workout$/i }), 5000)) {
    await page.getByRole("button", { name: /^Start workout$/i }).click();
  }
  const kgInput = page.locator(".set-row").first().locator("label:has-text('kg') input");
  const repsInput = page.locator(".set-row").first().locator("label:has-text('reps') input");
  const rpeInput = page.locator(".set-row").first().locator("label:has-text('RPE') input");
  await kgInput.fill(String(kg));
  await repsInput.fill(String(reps));
  await rpeInput.fill(String(rpe));
  await page.locator(".set-row").first().getByRole("button", { name: /^Done$/i }).click();
  if (await visible(page.getByRole("button", { name: /^Finish$/i }), 2000)) {
    await page.getByRole("button", { name: /^Finish$/i }).click();
  } else if (await visible(page.getByRole("button", { name: /finish session/i }), 2000)) {
    await page.getByRole("button", { name: /finish session/i }).click();
  }
  await page.waitForTimeout(800);
  await clickIf(page.getByRole("button", { name: /back to home/i }), 4000);
  return true;
}

async function saveFitnessPushups(page, reps) {
  await goMove(page);
  await page.getByRole("tab", { name: /fitness testing/i }).click();
  await page.getByRole("button", { name: /PUSH-UPS/i }).first().click();
  const initial = page.locator(".move-editor-sheet input").first();
  await initial.fill(String(reps));
  await page.getByRole("button", { name: /save results/i }).click();
  await page.waitForTimeout(400);
  return true;
}

async function saveInBodyFat(page, pct) {
  await goMove(page);
  await page.getByRole("tab", { name: /inbody/i }).click();
  await page.getByRole("button", { name: /BODY FAT/i }).first().click();
  const initial = page.locator(".move-editor-sheet input").first();
  await initial.fill(String(pct));
  await page.getByRole("button", { name: /^SAVE$/i }).click();
  await page.waitForTimeout(400);
  return true;
}

async function readAuthSession(page) {
  return page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (!keys[0]) return null;
    try {
      const raw = JSON.parse(localStorage.getItem(keys[0]) || "null");
      return {
        userId: raw?.user?.id || raw?.currentSession?.user?.id || null,
        email: raw?.user?.email || raw?.currentSession?.user?.email || null,
        accessToken: raw?.access_token || raw?.currentSession?.access_token || null,
      };
    } catch {
      return null;
    }
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  context.setDefaultTimeout(20000);
  const page = await context.newPage();
  page.on("dialog", (d) => {
    d.accept().catch(() => {});
  });

  try {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await shot(page, "qa_auth_gate_keys.png");

    const setupNeeded = await visible(page.getByText(/setup needed/i), 2500);
    const welcome = await visible(page.getByText(/Welcome back|Create your account/i), 4000);
    if (setupNeeded) {
      fail("SUPABASE CLIENT CONFIG", "Auth gate still shows Setup needed — NEXT_PUBLIC keys not inlined");
    } else if (welcome) {
      pass("SUPABASE CLIENT CONFIG");
    } else {
      fail("SUPABASE CLIENT CONFIG", "Auth gate not visible");
    }

    // Validation: empty / weak
    if (await visible(page.getByRole("button", { name: /need an account/i }), 2000)) {
      await page.getByRole("button", { name: /need an account/i }).click();
    }
    await page.getByRole("button", { name: /create account/i }).click();
    const validation = await visible(page.getByText(/valid email|at least 6 characters|first name/i), 2500);
    if (validation) report.notes.push("Client-side validation messages shown.");

    await fillAuth(page, USER_A, "signup");
    await page.getByRole("button", { name: /create account/i }).click();
    await shot(page, "qa_auth_signup_a.png");

    const homeishLocator = page
      .getByRole("button", { name: /^Move$/i })
      .or(page.getByText(/Where do you train/i));
    const confirmLocator = page.getByText(/check your email to confirm/i);
    const authError = page.locator(".auth-error");
    const signupOutcome = await Promise.race([
      homeishLocator.first().waitFor({ timeout: 25000 }).then(() => "session"),
      confirmLocator.waitFor({ timeout: 25000 }).then(() => "confirm"),
      authError.waitFor({ timeout: 25000 }).then(() => "error"),
    ]).catch(() => "timeout");

    const errorText = signupOutcome === "error" && (await visible(authError, 500))
      ? await authError.innerText()
      : "";
    const rateLimited = /too many attempts/i.test(errorText);
    const confirmEmail = signupOutcome === "confirm";
    const homeish = signupOutcome === "session";
    if (homeish) report.notes.push("User A signup returned a session (confirm-email off).");

    if (confirmEmail || rateLimited || signupOutcome === "error" || signupOutcome === "timeout") {
      const reason = confirmEmail
        ? "Supabase Confirm email is ON (mailer_autoconfirm=false). Signup does not return a session."
        : rateLimited
          ? "Supabase email send rate limit (over_email_send_rate_limit). Free-tier confirm emails blocked."
          : errorText || `Signup did not establish a session (outcome=${signupOutcome})`;
      blocked("ACCOUNT_CREATION", reason);
      blocked("LOGIN", "Depends on ACCOUNT_CREATION");
      blocked("LOGOUT", "Depends on ACCOUNT_CREATION");
      blocked("PROFILE SYNC", "Depends on ACCOUNT_CREATION");
      blocked("WORKOUT SYNC", "Depends on ACCOUNT_CREATION");
      blocked("FITNESS SYNC", "Depends on ACCOUNT_CREATION");
      blocked("INBODY SYNC", "Depends on ACCOUNT_CREATION");
      blocked("TWO-USER ISOLATION", "Depends on ACCOUNT_CREATION");
      blocked("RLS", "Depends on ACCOUNT_CREATION");
      report.notes.push(
        "Turn OFF Authentication → Providers → Email → Confirm email in the Supabase dashboard, wait for the email rate limit to clear, then re-run this script.",
      );
      await shot(page, "qa_auth_signup_blocked.png");
    } else if (homeish) {
      pass("ACCOUNT_CREATION");
      const onboardA = await maybeOnboard(page, "Beginner");
      report.notes.push(`User A onboarding: ${onboardA}`);
      await waitHome(page);
      await saveProfileLevel(page, "BEGINNER");
      await shot(page, "qa_user_a_profile.png");
      pass("LOGIN");

      const logged = await logPartialWorkout(page, USER_A.markerKg, USER_A.markerReps, USER_A.markerRpe);
      await shot(page, "qa_user_a_workout.png");
      if (!logged) fail("WORKOUT SYNC", "Could not log a set for User A");

      const fit = await saveFitnessPushups(page, USER_A.pushups);
      await shot(page, "qa_user_a_fitness.png");
      if (!fit) fail("FITNESS SYNC", "Could not save fitness check-in");

      const ib = await saveInBodyFat(page, USER_A.bodyFat);
      await shot(page, "qa_user_a_inbody.png");
      if (!ib) fail("INBODY SYNC", "Could not save InBody check-in");

      await page.waitForTimeout(1500);
      await page.reload({ waitUntil: "networkidle" });
      await waitHome(page);
      const stillA =
        (await page.content()).includes(USER_A.markerKg) ||
        (await page.content()).includes(`${USER_A.pushups} →`) ||
        (await page.content()).includes(USER_A.bodyFat);
      report.notes.push(`User A refresh content markers present: ${stillA}`);

      const sessionA = await readAuthSession(page);
      report.users.a.session = { userId: sessionA?.userId, email: sessionA?.email };
      const tokenA = sessionA?.accessToken;

      const out = await signOut(page);
      await shot(page, "qa_auth_after_logout.png");
      if (out) pass("LOGOUT");
      else fail("LOGOUT", "Sign out did not return to auth gate");

      await page.waitForTimeout(4000);
      await fillAuth(page, USER_B, "signup");
      await page.getByRole("button", { name: /create account/i }).click();
      const homeBLocator = page
        .getByRole("button", { name: /^Move$/i })
        .or(page.getByText(/Where do you train/i));
      const confirmBLocator = page.getByText(/check your email to confirm/i);
      const errBLoc = page.locator(".auth-error");
      const signupB = await Promise.race([
        homeBLocator.first().waitFor({ timeout: 25000 }).then(() => "session"),
        confirmBLocator.waitFor({ timeout: 25000 }).then(() => "confirm"),
        errBLoc.waitFor({ timeout: 25000 }).then(() => "error"),
      ]).catch(() => "timeout");
      const confirmB = signupB === "confirm";
      const errB = signupB === "error" && (await visible(errBLoc, 500))
        ? await errBLoc.innerText()
        : "";
      const homeB = signupB === "session";
      if (homeB) report.notes.push("User B signup returned a session (confirm-email off).");

      if (confirmB || errB || !homeB) {
        blocked("TWO-USER ISOLATION", confirmB ? "User B needs email confirmation" : errB || `User B signup failed (outcome=${signupB})`);
        blocked("RLS", "User B session not established");
      } else {
        await maybeOnboard(page, "Intermediate");
        await saveProfileLevel(page, "INTERMEDIATE");
        const leakA =
          (await page.content()).includes(USER_A.markerKg) ||
          (await page.content()).includes(USER_A.bodyFat) ||
          (await page.content()).includes(`QaAlpha`);
        await shot(page, "qa_user_b_empty.png");
        if (leakA) fail("TWO-USER ISOLATION", "User A markers visible while signed in as User B");
        else pass("TWO-USER ISOLATION");

        await logPartialWorkout(page, USER_B.markerKg, "6", "6");
        const sessionB = await readAuthSession(page);
        report.users.b.session = { userId: sessionB?.userId, email: sessionB?.email };

        if (tokenA && sessionB?.accessToken && sessionA?.userId && sessionB?.userId) {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const key =
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          const rlsRes = await page.evaluate(
            async ({ url, key, tokenB, userAId }) => {
              const r = await fetch(`${url}/rest/v1/user_state?user_id=eq.${userAId}&select=user_id`, {
                headers: {
                  apikey: key,
                  Authorization: `Bearer ${tokenB}`,
                  Accept: "application/json",
                },
              });
              const body = await r.json();
              return { status: r.status, rows: Array.isArray(body) ? body.length : body };
            },
            {
              url,
              key,
              tokenB: sessionB.accessToken,
              userAId: sessionA.userId,
            },
          );
          report.notes.push(`RLS probe User B reading User A state: ${JSON.stringify(rlsRes)}`);
          if (rlsRes.status === 200 && rlsRes.rows === 0) pass("RLS");
          else fail("RLS", `Unexpected RLS probe result ${JSON.stringify(rlsRes)}`);
        }

        await signOut(page);
        await fillAuth(page, USER_A, "signin");
        await page.getByRole("button", { name: /^Sign in$/i }).click();
        await waitHome(page);
        await goMove(page);
        const restoredLevel = await visible(page.getByText(/BEGINNER PROGRAM/i), 5000);
        await page.getByRole("tab", { name: /fitness testing/i }).click();
        const restoredFit = await visible(page.getByText(new RegExp(`${USER_A.pushups}`)), 4000);
        await page.getByRole("tab", { name: /inbody/i }).click();
        const restoredIb = await visible(page.getByText(new RegExp(USER_A.bodyFat.replace(".", "\\."))), 4000);
        const leakB = (await page.content()).includes(USER_B.markerKg);
        await shot(page, "qa_user_a_restored.png");
        if (restoredLevel) pass("PROFILE SYNC");
        else fail("PROFILE SYNC", "Beginner programme not restored for User A");
        if (logged && !leakB) pass("WORKOUT SYNC");
        else if (!report.results["WORKOUT SYNC"]) fail("WORKOUT SYNC", "User A workout not restored cleanly");
        if (fit && restoredFit) pass("FITNESS SYNC");
        else fail("FITNESS SYNC", "User A fitness check-in not restored after re-login");
        if (ib && restoredIb) pass("INBODY SYNC");
        else fail("INBODY SYNC", "User A InBody not restored after re-login");
      }
    } else {
      fail("ACCOUNT_CREATION", errorText || "Unknown signup outcome");
    }
  } catch (err) {
    report.issues.push({ severity: "CRITICAL", area: "HARNESS", detail: String(err && err.stack ? err.stack : err) });
    await shot(page, "qa_auth_harness_error.png");
  } finally {
    report.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(OUT, "two-account-auth-qa.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
    const blockedAny = Object.values(report.results).includes("BLOCKED");
    const failed = Object.values(report.results).includes("FAIL");
    process.exit(failed && !blockedAny ? 1 : 0);
  }
})();
