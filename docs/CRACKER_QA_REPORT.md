# Christmas Cracker — QA Audit Report

**Branch:** `cursor/cracker-qa-audit-511a`  
**Base:** `cursor/move-fitness-inbody-511a`  
**Updated:** 2026-09-20 (post-fix retest)

**Environment:** Cursor Cloud Agent VM — **Supabase publishable key still missing** (URL prepared for `kvhthuektwwffsobiuww`)

---

## Scorecard (retest)

| Area | Result | Notes |
|------|--------|-------|
| ACCOUNT_CREATION / LOGIN | **BLOCKED** | Needs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or ANON) — do not mark PASS yet |
| PROFILE_SAVING | **PASS** | |
| BEGINNER / INTERMEDIATE | **PASS** | |
| WORKOUT_SAVING | **PASS** | Strength + session draft |
| WOD_TRACKING | **PASS** | Format-specific logger (AMRAP verified E2E; all kinds typed) |
| FITNESS / INBODY / MEASUREMENTS | **PASS** | |
| NOURISH / CONNECT | **PASS** | |
| CHALLENGE_DATES | **PASS** | Full milestone list on Home via `lib/challengeDates.ts` |
| MOVE_SCROLL | **PASS** | sticky clearance + scroll-margin |
| BOTTOM_NAV_OVERLAP | **PASS** | `--cracker-tabbar-clearance` (96px measured) |
| DATA_PERSISTENCE | **PASS** | WOD `wodResult` in `forma-session-v1` draft |
| USER_DATA_ISOLATION | **PASS*** | Code path; live two-account needs Supabase |
| PRODUCTION_BUILD | **PASS** | `pnpm build` OK |
| MOBILE_FLOW | **PASS** | 375 / 390 |

---

## Fixes in this iteration

1. **WOD logging** — `lib/wod.ts` + `components/WodLogger.tsx`; `ExerciseResult.wodResult` separate from `SetResult`
2. **Session drafts** — WOD scores persist in existing `forma-session-v1` (live timer is in-memory only)
3. **Auth staging readiness** — `supabaseConfigDiagnostics()`; AuthScreen lists missing env **names** only
4. **Challenge dates** — `lib/challengeDates.ts` + Home milestones (registration close, party, champion)
5. **MOVE sticky / bottom nav** — scroll-margin on results; `--cracker-tabbar-clearance` padding

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

## Staging Auth checklist (when keys present)

USER A: create → Beginner → partial workout + Fitness + InBody → logout  
USER B: create → confirm empty → Intermediate → log → logout  
USER A: login → Beginner + data restored  

Do **not** mark AUTH PASS until that run succeeds.

---

## Evidence

- `qa_wod_logger.png` — AMRAP rounds / extra reps  
- `qa_challenge_dates_home.png` — milestones  
- `qa_move_scroll_fitness.png` — sticky clearance  
- `qa_bottom_nav_inbody.png` — bottom padding  
- Prior: `qa_manual_*` GUI pass artifacts  
