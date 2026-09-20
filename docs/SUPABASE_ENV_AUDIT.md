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

## Current VM state (2026-09-20, two-account Auth retest)

- URL: present (`kvhthuektwwffsobiuww.supabase.co`)
- Publishable key: **present** (`sb_publishable_…`) — used by `getSupabaseKey()`
- Anon JWT: **present** (fallback only; not used while publishable is set)
- Service role: **not set** (correct — never used)

GoTrue `/auth/v1/health` returns 200 with the publishable key.

Two real accounts signed in with the publishable key (no service-role). Isolation + RLS verified.

Live `profiles` table is missing the `club` column from `supabase/schema.sql`. `pushProfile()` retries the upsert without `club` so name/level still sync. Run this in the SQL editor to add it:

```sql
alter table public.profiles add column if not exists club text not null default '';
```

## Scorecard (Auth / sync) — two-account live

| Check | Result |
|-------|--------|
| SUPABASE CLIENT CONFIG | **PASS** |
| ACCOUNT CREATION | **PASS** |
| LOGIN | **PASS** |
| LOGOUT | **PASS** |
| PROFILE SYNC | **PASS** (club column absent; upsert retried without it) |
| WORKOUT SYNC | **PASS** |
| FITNESS SYNC | **PASS** |
| INBODY SYNC | **PASS** |
| TWO-USER ISOLATION | **PASS** |
| RLS | **PASS** |
| ACCOUNT RESTORE | **PASS** (User A Beginner + fitness/InBody restored; User B rows not visible) |

Harness: `node scripts/two-account-auth-test.cjs` (browser key only).

Schema expects `profiles` + `user_state`; Cracker check-ins sync into `user_state.programme.crackerMoveCheckIns` when signed in. Sign-out flushes that blob before clearing local cache.
