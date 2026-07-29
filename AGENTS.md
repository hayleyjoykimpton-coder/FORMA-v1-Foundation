# Accounts & cloud sync (Cursor Cloud)

## How many users?
- **Unlimited sign-ups** — each account is isolated by Supabase Row Level Security.
- Practical free-tier capacity is typically **tens of thousands of monthly active users** (Supabase Free). Scale with a paid plan when you outgrow it.
- Without Supabase keys, FORMA still runs in **this-device-only** mode (one local profile per browser).

## Setup
1. Create a project at https://supabase.com
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Add secrets / `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred) or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Restart `pnpm dev`

## Behaviour
- Auth gate on launch when configured (Sign in / Sign up / Continue on this device only)
- Signed-in users sync profile, workouts, history, progress, photos, water, journal, wellness (gratitude + breathwork logs nested in `programme.wellness`), and session drafts
- Local `localStorage` remains an offline cache (`forma-wellness-v1` for gratitude/breathwork)
- Profile → Account shows sync status + Sign out

## Dev tip: email confirmation
Supabase Free often rate-limits confirmation emails. For local testing, turn off
**Authentication → Providers → Email → Confirm email**, then sign up with your real address.

## Cursor Cloud specific instructions

- Dev: `pnpm install` then `pnpm dev` (port 3000). Lint/test via `pnpm lint` / `pnpm test` when present.
- Auth is **client-side** (`lib/supabase.ts`, `lib/sync.ts`). `middleware.ts` is a pass-through — do **not** re-wire Supabase Edge session refresh without verifying Vercel preview; it previously caused `MIDDLEWARE_INVOCATION_FAILED` (500) on `/`.
- For cloud auth on Vercel preview/prod, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or anon key) in the Vercel project env, then redeploy. Without keys the site still loads in local-only mode.
- Wellness foundations: daily gratitude on Today (`lib/wellness.ts`); guided breathwork on Recovery (`components/Breathwork.tsx`). Recovery readiness % comes from recent session readiness **and** standalone check-ins — not a hardcoded score.
- Daily sleep hours + steps live in `wellness.daily` (Today · Body signals). Profile `sleepAverage` / `dailySteps` remain goals/defaults, not the day log.
- Exercise form videos: curated YouTube links + search fallback (`lib/exerciseVideos.ts`). Users can paste their own YouTube/Vimeo URL on each exercise in Training edit. **Do not** store uploaded video files in localStorage / `user_state` JSON — needs Supabase Storage later (with App Store / Capacitor path).
- Nutrition: goal-aware targets from `profile.nutritionGoal` (`lib/nutritionTargets.ts`). Meal log + optional AI photo via `POST /api/analyze-meal` (`OPENAI_API_KEY` server-only). Without the key, manual macros still work. Meals sync under `programme.meals`.
- Home UX: one dominant **Do this next** card (`lib/nextAction.ts`); secondary modules sit in collapsibles. Prefer progressive disclosure over adding more equal-weight cards.
- **Do not replace** the editorial AI images in `public/img/` (hero, recovery, nutrition, glutes, upper, etc.). Hayley likes them as-is — keep using the existing paths in `lib/content.ts` `IMAGES`.

## Product note — App Store (paused)
Hayley asked to **pause** native App Store work for now. Preferred path later: **Capacitor iOS wrapper** around the existing Next.js app (then HealthKit + real push).

**Remind her when ready**, roughly when most of this is true:
- Web product feels stable on **formafigure.com** (auth, sync, programme, swaps, phases, cues, wins, reminders)
- She’s using it daily and wants phone-home-screen / Health / closed-app notifications
- Apple Developer account is available ($99/yr) and someone can run Xcode / TestFlight

Do **not** start Capacitor/App Store scaffolding until she asks again or those readiness signals are clear.
