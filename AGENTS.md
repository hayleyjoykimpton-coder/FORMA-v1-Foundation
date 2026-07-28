# Accounts & cloud sync (Cursor Cloud)

## How many users?
- **Unlimited sign-ups** — each account is isolated by Supabase Row Level Security.
- Practical free-tier capacity is typically **tens of thousands of monthly active users** (Supabase Free). Scale with a paid plan when you outgrow it.
- Without Supabase keys, FORMA still runs in **this-device-only** mode (one local profile per browser).

## Setup
1. Create a project at https://supabase.com
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Add secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Restart `pnpm dev`

## Behaviour
- Auth gate on launch when configured (Sign in / Sign up / Continue on this device only)
- Signed-in users sync profile, workouts, history, progress, photos, water, journal, and session drafts
- Local `localStorage` remains an offline cache
- Profile → Account shows sync status + Sign out
