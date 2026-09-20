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
1. `NEXT_PUBLIC_SUPABASE_URL` = `https://kvhthuektwwffsobiuww.supabase.co`
2. **Either** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` **or** `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 6. Service-role / private keys in frontend?

**None found.** No `service_role`, `SUPABASE_SERVICE_ROLE`, or private key env reads in app/frontend code. Comment in `lib/supabase.ts` explicitly forbids exposing service_role to the browser.

**Do not** put a service-role key in any `NEXT_PUBLIC_*` variable.

## Current VM state

- URL present in `.env.local`
- Publishable key: **empty**
- Anon key: **empty**

Two-account isolation test: **not run** (blocked on missing browser key).

## Scorecard (Auth / sync) — until keys + two-account test

| Check | Result |
|-------|--------|
| SUPABASE CLIENT CONFIG | **FAIL** (key missing) |
| ACCOUNT CREATION | **FAIL** |
| LOGIN | **FAIL** |
| LOGOUT | **FAIL** |
| PROFILE SYNC | **FAIL** |
| WORKOUT SYNC | **FAIL** |
| FITNESS SYNC | **FAIL** |
| INBODY SYNC | **FAIL** |
| TWO-USER ISOLATION | **FAIL** |
| RLS | **FAIL*** |

\*RLS policies exist in `supabase/schema.sql` (`auth.uid() = id` / `user_id`) but are **not verified** against a live project until Auth works.

Schema expects `profiles` + `user_state`; Cracker check-ins sync into `user_state.programme.crackerMoveCheckIns` when signed in.
