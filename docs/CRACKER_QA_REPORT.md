# Christmas Cracker — QA Audit Report

**Branch:** `cursor/cracker-qa-audit-511a`  
**Base:** `cursor/move-fitness-inbody-511a`  
**Date:** 2026-09-20  
**Environment:** Cursor Cloud Agent VM — **Supabase keys not configured** (`.env.local` empty)

---

## Scorecard

| Area | Result | Notes |
|------|--------|-------|
| ACCOUNT_CREATION | **BLOCKED** | Auth UI present; live Supabase register not runnable in this VM |
| LOGIN | **BLOCKED** | Same — gate + Continue on this device works |
| PROFILE_SAVING | **PASS** | Club + Beginner/Intermediate persist in `forma-profile-v1` across refresh |
| BEGINNER_PROGRAM | **PASS** | Lower / Upper / Full Body generated for week 1–6 |
| INTERMEDIATE_PROGRAM | **PASS** | Intermediate programme builds; history retains `crackerLevel` |
| WORKOUT_SAVING | **PASS** | History + session draft localStorage; completion tagged with level |
| WOD_TRACKING | **FAIL** | WODs use generic sets/reps/RPE — not AMRAP rounds+reps / FOR TIME / Death By |
| FITNESS_TESTING | **PASS** | INITIAL/FINAL cards, change maths, persist + reload (see artifacts) |
| INBODY | **PASS** | Start/Final + numerical change only |
| MEASUREMENTS | **PASS** | Chest/Waist/Hips Start/Final + change |
| NOURISH_LINK | **PASS** | External `christmas-cracker-2026.netlify.app` only — no nutrition goals |
| CONNECT_LINK | **PASS** | Facebook group URL present |
| MOBILE_FLOW | **PASS** | 390×844 nav + Move sub-tabs usable |
| DATA_PERSISTENCE | **PASS** | Profile, workouts, history, check-ins survive reload |
| USER_DATA_ISOLATION | **PASS*** | *After fix:* clear on sign-out; no cross-account history merge |
| PRODUCTION_BUILD | **PASS** | `pnpm build` succeeded |

\*Isolation was **CRITICAL FAIL** before this PR’s fixes.

---

## Fixes applied in this PR

1. **`lib/localMemberData.ts`** — `clearLocalMemberData()` wipes member localStorage on sign-out.
2. **`FormaApp` cloud boot** — skips merging local history unless profile belongs to signed-in user; never seeds Hayley into cloud accounts; rebuilds Cracker workouts when `challengeMode === "cracker"`.
3. **`lib/sync.ts`** — `crackerMoveCheckIns` stored in `user_state.programme` for cross-device sync when Auth is configured.
4. **`AuthScreen`** — member-friendly errors; copy no longer claims meal sync.

---

## Issues

### CRITICAL

| Issue | Screen | Repro | Cause | Fix | Retest |
|-------|--------|-------|-------|-----|--------|
| Live account create/login not verified | Auth | No Supabase env | Missing `NEXT_PUBLIC_SUPABASE_*` | Configure project env + retest two real accounts | **Blocked in VM** |

### HIGH (pre-fix → fixed)

| Issue | Screen | Repro | Cause | Fix | Retest |
|-------|--------|-------|-------|-----|--------|
| User A data visible to User B on same browser | Sign-out / Sign-in | Complete workout as A, sign out, sign in as B | Global localStorage keys + history merge | Clear on sign-out; refuse cross-user merge | Unit wipe + code path **PASS** |
| Empty cloud login could seed Hayley demo | Cloud first login | New account, empty cloud | `seedHayley: !localProfile` | Always `seedHayley: false` on cloud empty path | Code review **PASS** |
| Fitness/InBody not in cloud sync | MOVE check-ins | Sign in on device 2 | Check-ins local-only | Sync via `programme.crackerMoveCheckIns` | Needs Supabase env to fully retest |

### HIGH (open)

| Issue | Screen | Repro | Cause | Fix / recommendation | Retest |
|-------|--------|-------|-------|----------------------|--------|
| WOD logging not format-specific | Live session | Start workout → WOD exercise | Single `SetResult` {reps,weight,rpe} | Add WOD result shape: AMRAP rounds+reps, FOR TIME seconds, EMOM/Death By minute | Still **FAIL** |

### MEDIUM

| Issue | Screen | Detail |
|-------|--------|--------|
| Incomplete challenge dates in UI | Home / Profile | Shows 12 Oct–22 Nov 2026; missing registration close, party weekend (27–29 Nov), champion (5 Dec) |
| Sticky Move sub-nav can obscure “YOUR RESULTS” | Fitness / InBody | Add scroll padding under sticky pills |
| Bottom nav overlaps tappable cards when scrolling | InBody / long Move screens | Tab bar can intercept taps (e.g. WAIST card) — add bottom content padding |
| Auth copy previously overclaimed meals | Auth | Fixed in this PR |
| Jess weekly videos all Coming Soon | MOVE education | Expected until URLs provided |

### LOW

| Issue | Detail |
|-------|--------|
| Onboarding name defaults to “Friend” | No name step in Cracker onboarding |
| Playwright sometimes showed stray “N” near tab bar | Likely tooling chrome; not found in Cracker components |

---

## Manual GUI pass (390px) — follow-up

Completed after automated audit ([Manual Cracker workout QA](bc-91b78ccc-b2ca-5f33-b633-dab729231c3b)):

| Check | Result |
|-------|--------|
| MOVE sticky sub-tabs | **PASS** |
| Start Lower Body + log set (12 kg / 8 / RPE 7) | **PASS** |
| Fitness Testing INITIAL/FINAL + deltas | **PASS** |
| InBody + Measurements cards + WAIST modal | **PASS** |
| Nourish → `christmas-cracker-2026.netlify.app` | **PASS** |
| Connect Facebook CTA | **PASS** |
| Profile Beginner → Intermediate updates MOVE badge | **PASS** |
| Format-specific WOD fields in session | **FAIL** (confirmed: KG/REPS/RPE only) |

Artifacts: `qa_manual_workout_session_set_logged.webp`, `qa_manual_fitness_testing_initial_final.webp`, `qa_manual_inbody_measurements.webp`, `qa_manual_nourish_external_link.webp`, `qa_manual_connect_facebook.webp`, `qa_manual_profile_intermediate_updated.webp`

---

## Storage map

| Data | Store |
|------|--------|
| Auth users | **DATABASE** Supabase Auth (when configured) |
| Profile (name, club, experienceLevel) | **LOCAL_STORAGE** `forma-profile-v1` + **DATABASE** `profiles` |
| Workouts / history / week | **LOCAL_STORAGE** `forma-workouts-v12` / `forma-history-v12` + **DATABASE** `user_state` |
| Session draft | **LOCAL_STORAGE** `forma-session-v1` + cloud `session_draft` |
| Fitness / InBody / Measurements | **LOCAL_STORAGE** `forma-cracker-move-checkins-v1` + **DATABASE** `user_state.programme.crackerMoveCheckIns` (after fix) |
| Move checklist / sub-tab | **LOCAL_STORAGE** only |

Anything important that was **in-memory only**: live workout timer state (expected — document limitation).

---

## Challenge dates audit

| Milestone | Expected | In app |
|-----------|----------|--------|
| Registration close | 12 Oct 2026 | **Missing** as labelled milestone |
| Pre-challenge scans | 5–12 Oct 2026 | **Yes** (InBody tab) |
| Initial fitness | 10 Oct 2026 | **Yes** |
| Starts | 12 Oct 2026 | **Yes** |
| End fitness | 22 Nov 2026 | **Yes** |
| Final scans | 22–26 Nov 2026 | **Yes** |
| Party weekend | 27–29 Nov 2026 | **Missing** |
| Champion announcement | 5 Dec 2026 | **Missing** |

No outdated 2025 dates found.

---

## NOURISH / CONNECT

- **NOURISH:** External gateway only → `https://christmas-cracker-2026.netlify.app/` — **PASS**
- **CONNECT:** Facebook share URL configured — **PASS**; no fake event calendar

---

## Recommended next steps (priority order)

1. Configure Supabase in staging and retest **two real accounts** end-to-end (create, logout, login, isolation).
2. Implement format-specific **WOD logging** (highest remaining product gap).
3. Surface missing **challenge dates** on Home.
4. Add scroll-padding under sticky Move sub-nav.

---

## Evidence artifacts

- `qa_auth_gate.png` — Continue on this device / setup gate  
- `qa_home_after_onboarding.png` — post-onboarding Home  
- `qa_move_training.png` / `qa_move_tab.png` — Move sub-tabs  
- `qa_fitness_persisted.png` / `qa_fitness_editor.png` — Fitness Testing + editor  
- `qa_inbody_persisted.png` — InBody + Measurements  
- `qa_nourish.png` / `qa_connect.png` — external links  
- `cracker_qa_report.json` — machine-readable scorecard  
- Production build: `pnpm build` OK  
