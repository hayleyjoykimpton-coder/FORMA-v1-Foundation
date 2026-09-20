# Supabase environment variable audit

**Date:** 2026-09-20  
**Branch:** `cursor/cracker-qa-audit-511a`  
**Project ref (from user):** `kvhthuektwwffsobiuww`

## 1. Variables the running app actually reads

| Variable | Read by | Live path? |
|----------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts` → `getSupabaseUrl()` | **Yes** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `lib/supabase.ts` → `getSupabaseKey()` (preferred) | **Yes** (if set) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts` → `getSupabaseKey()` (fallback) | **Yes** (only if publishable empty) |

`isSupabaseConfigured()` requires **URL + (publishable OR anon)**.

Consumers of `getSupabase()` / `isSupabaseConfigured()`:
- `lib/sync.ts` — signUp / signIn / signOut / pull / push
- `components/FormaApp.tsx` — boot + `onAuthStateChange`
- `components/AuthScreen.tsx` — gate + diagnostics

## 2. Unused / not on the live request path

| File | Status |
|------|--------|
| `utils/supabase/client.ts` | Reads same three env vars; **not imported** by app components |
| `utils/supabase/server.ts` | Same; **not imported** |
| `utils/supabase/middleware.ts` | Same; **not wired** — root `middleware.ts` is pass-through only |

These helpers are dead for the current Christmas Cracker / FORMA client auth path. Safe to ignore for secret setup.

## 3. Where the Supabase client is created (live)

**`lib/supabase.ts` → `getSupabase()`**

```ts
createClient(getSupabaseUrl()!, getSupabaseKey()!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
```

Uses `@supabase/supabase-js` `createClient` (browser).

## 4. Publishable vs anon

- **Preferred:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`)
- **Fallback:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT anon)
- Code: `publishable || anon`

## 5. Are both keys required?

**No.** Exactly one browser key is enough, plus URL.

Minimum for Auth QA:
1. `NEXT_PUBLIC_SUPABASE_URL` = `[REDACTED]`
2. **Either** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **or** `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 6. Service-role / private keys in frontend?

**None found.** No `service_role`, `SUPABASE_SERVICE_ROLE`, or private key env reads in app/frontend code. Comment in `lib/supabase.ts` explicitly forbids exposing service_role to the browser.

**Do not** put a service-role key in any `NEXT_PUBLIC_*` variable. Tests never read `SUPABASE_SERVICE_ROLE_KEY`.

## Current VM state (2026-09-20, confirm-email OFF retest)

- URL: present (`kvhthuektwwffsobiuww.supabase.co`)
- Publishable key: **present** (`sb_publishable_…`) — used by `getSupabaseKey()`
- Anon JWT: **present** (fallback only; not used while publishable is set)
- Service role: **not used** (correct — never added to `.env.local` or the test client)
- **Confirm email: OFF** — signup returns a session immediately (`sessionOnSignup: true`). No Mailinator confirm step.

GoTrue `/auth/v1/health` returns 200 with the publishable key.

Fresh accounts (unique mailinator addresses; previous QA_USER_* not reused). Isolation + RLS verified via API and UI.

Live `profiles.club` is **present** (verified 2026-09-20): upsert `club: "fremantle"` then re-login returned the same value. `pushProfile()` still retries without `club` if an older project is missing the column.

`handle_new_user` still inserts a stub `profiles` + empty `user_state` on signup. The app now treats that stub as **not onboarded** (`cloudMemberNeedsCrackerOnboarding`) so club + Beginner/Intermediate onboarding still runs.

## Scorecard (Auth / sync) — two-account live, confirm-email off

| Check | API (`two-account-auth-test.cjs`) | UI (`two-account-auth-qa.cjs`) |
|-------|-----------------------------------|--------------------------------|
| SUPABASE CLIENT CONFIG | **PASS** | **PASS** |
| ACCOUNT CREATION | **PASS** (session on signup) | **PASS** (session on signup) |
| LOGIN | **PASS** | **PASS** |
| LOGOUT | **PASS** | **PASS** |
| PROFILE SYNC | **PASS** (`club` column present; Fremantle round-trip) | **PASS** (Beginner restored) |
| WORKOUT SYNC | **PASS** | **PASS** |
| FITNESS SYNC | **PASS** | **PASS** |
| INBODY SYNC | **PASS** | **PASS** |
| TWO-USER ISOLATION | **PASS** | **PASS** |
| RLS | **PASS** | **PASS** (B read of A `user_state` → 0 rows) |
| ACCOUNT RESTORE | **PASS** (User A Beginner + fitness/InBody; B rows not visible) | **PASS** |

Harnesses use the browser key only. Emails/passwords redacted.

Schema expects `profiles` + `user_state`; Cracker check-ins sync into `user_state.programme.crackerMoveCheckIns` when signed in. Sign-out flushes that blob before clearing local cache.
