# Christmas Cracker — QA Audit Report

**Branch:** `cursor/cracker-qa-audit-511a`  
**Base:** `cursor/move-fitness-inbody-511a`  
**Updated:** 2026-09-20 (confirm-email **OFF** — two-account Auth **PASS** API + UI)

**Environment:** Cursor Cloud Agent VM — `NEXT_PUBLIC_SUPABASE_URL` + publishable key present. Fresh accounts (no reused QA_USER_*). No service-role key used.

**Supabase Auth:** Confirm email is **OFF** (`Authentication → Providers → Email → Confirm email`). Signup returns a session immediately; no inbox/Mailinator confirm step.

---

## Scorecard (retest)

| Area | Result | Notes |
|------|--------|-------|
| SUPABASE CLIENT CONFIG | **PASS** | Auth gate, no “Setup needed”; GoTrue health 200 |
| ACCOUNT_CREATION / LOGIN | **PASS** | Fresh accounts; session on signup; login + logout + User A restore |
| PROFILE_SAVING | **PASS** | Cloud + local. Live `profiles.club` present; Fremantle persisted after re-login |
| BEGINNER / INTERMEDIATE | **PASS** | User A onboarding → Beginner restored; User B Intermediate; no leak |
| WORKOUT_SAVING | **PASS** | Cloud `user_state.history` (API) + UI Nice-work finish + restore |
| WOD_TRACKING | **PASS** | Format-specific logger (AMRAP verified E2E; all kinds typed) |
| FITNESS / INBODY / MEASUREMENTS | **PASS** | Cloud `programme.crackerMoveCheckIns`; UI restore of push-ups + body fat |
| NOURISH / CONNECT | **PASS** | |
| CHALLENGE_DATES | **PASS** | Full milestone list on Home via `lib/challengeDates.ts` |
| MOVE_SCROLL | **PASS** | sticky clearance + scroll-margin |
| BOTTOM_NAV_OVERLAP | **PASS** | `--cracker-tabbar-clearance` (96px measured) |
| DATA_PERSISTENCE | **PASS** | WOD `wodResult` in `forma-session-v1` draft |
| USER_DATA_ISOLATION | **PASS** | User B cannot read/write User A `profiles` / `user_state`; A restore hides B |
| PRODUCTION_BUILD | **PASS** | `pnpm build` OK |
| MOBILE_FLOW | **PASS** | 375 / 390 |

---

## Fixes in this iteration

1. **Confirm-email-off Auth retest** — fresh signups return a session immediately (`scripts/two-account-auth-test.cjs` + UI harness).
2. **Stub-profile onboarding** — `handle_new_user` inserts a `profiles` row on signup, which previously skipped club/level onboarding. New empty cloud members now see Cracker onboarding; signed-up first name is kept (`cloudMemberNeedsCrackerOnboarding`).
3. **UI harness** — unique mailinator addresses (no inbox needed); finish-session dialog no longer double-accepted; wait for Nice work.

---

## WOD formats supported

| Kind | UI fields |
|------|-----------|
| AMRAP | Timer, rounds, extra reps, loads, save → `6 rounds + 14 reps` |
| FOR TIME / Ladder | Timer, MM:SS, loads, save |
| EMOM | Optional rounds, loads, mark completed |
| Death By | Last completed minute, optional incomplete reps, loads |
| Tabata | Optional score, loads, mark completed |
| Every X min (interval) | Per-set MM:SS, loads |

**Timer limitation:** Start/Pause/Reset work in-session; refresh resets the live clock. Saved scores and loads survive via session draft.

---

## Staging Auth checklist

USER A: create → Beginner → partial workout + Fitness + InBody → logout  
USER B: create → confirm empty → Intermediate → log → logout  
USER A: login → Beginner + data restored  

| Step | Result |
|------|--------|
| USER A create (session on signup) | **PASS** |
| USER A Beginner onboarding | **PASS** |
| USER A partial workout + Fitness + InBody | **PASS** |
| USER A logout → auth gate | **PASS** |
| USER B create → empty (no User A data) | **PASS** |
| USER B Intermediate + log | **PASS** |
| USER A login → Beginner + fitness/InBody restored | **PASS** |
| RLS (B cannot read A `user_state`) | **PASS** |

**Live API/RLS run:** **PASS** (`scripts/two-account-auth-test.cjs`, publishable key only, `sessionOnSignup: true` for A and B).  
**Live UI run:** **PASS** (`scripts/two-account-auth-qa.cjs` against `pnpm dev :3000`).

---

## Remaining dashboard notes

1. ~~Add `profiles.club`~~ **Done** — column present; club value round-trips on re-login. App still retries without `club` for older projects.
2. Confirm email is **currently OFF** (correct for this staging retest). Turn it back **on** for production if you want verified inboxes — signup will then stop returning a session until the member confirms.
3. Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to the app or any `NEXT_PUBLIC_*` variable.

---

## Evidence

- `two_account_auth_report.json` — live two-account API/RLS scorecard (all PASS, session on signup)
- `two-account-auth-qa.json` — live UI harness scorecard (all PASS)
- `auth_gate_with_supabase_keys.png` — Auth gate with keys (no Setup needed)
- `auth_logout_returns_to_gate.png` — Sign out returns to Welcome back
- `user_b_home_empty_no_user_a_data.png` — User B Home empty (0/3, no User A markers)
- `user_a_fitness_pushups_saved.png` — User A push-ups 12
- `user_a_inbody_restored_after_relogin.png` — User A body fat 22.5% after re-login
- `qa_auth_invalid_login.png` — friendly invalid-login copy
- `qa_wod_logger.png` — AMRAP rounds / extra reps  
- `qa_challenge_dates_home.png` — milestones  
- `qa_move_scroll_fitness.png` — sticky clearance  
- `qa_bottom_nav_inbody.png` — bottom padding  
- Prior: `qa_manual_*` GUI pass artifacts  
