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
- Signed-in users sync profile, workouts, history, progress, photos, water, journal, and session drafts
- Local `localStorage` remains an offline cache
- Profile → Account shows sync status + Sign out

## Dev tip: email confirmation
Supabase Free often rate-limits confirmation emails. For local testing, turn off
**Authentication → Providers → Email → Confirm email**, then sign up with your real address.

## Cursor Cloud specific instructions

- Dev: `pnpm install` then `pnpm dev` (port 3000). Lint/test via `pnpm lint` / `pnpm test` when present.
- Auth is **client-side** (`lib/supabase.ts`, `lib/sync.ts`). `middleware.ts` is a pass-through — do **not** re-wire Supabase Edge session refresh without verifying Vercel preview; it previously caused `MIDDLEWARE_INVOCATION_FAILED` (500) on `/`.
- For cloud auth on Vercel preview/prod, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or anon key) in the Vercel project env, then redeploy. Without keys the site still loads in local-only mode.
