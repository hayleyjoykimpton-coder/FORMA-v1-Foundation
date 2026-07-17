# AGENTS.md

## Cursor Cloud specific instructions

FORMA is a single, browser-only Next.js 16 / React 19 app (TypeScript). There is no backend, database, or external service — all state persists in the browser via `localStorage` (see `components/FormaApp.tsx`). The repo root is the app root.

- Package manager is pnpm (`packageManager: pnpm@10.12.1`); Node 22 is used. Dependencies are installed by the startup update script (`pnpm install`).
- Run the dev server with `pnpm dev` (Next.js Turbopack, serves on `http://localhost:3000`). Scripts live in `package.json` (`dev`, `build`, `start`).
- No lint script or ESLint config exists in this repo, so there is no lint command to run. Type checking is available via `npx tsc --noEmit`.
- `next build` / `next dev` auto-regenerate `next-env.d.ts` and may reformat/extend `tsconfig.json` (e.g. adding `.next/dev/types/**/*.ts` to `include`). These are build-generated and gitignored/expected noise — do not commit them.
- The install ignores the `sharp` build script; this is harmless (image optimization falls back) and both build and dev work without approving it.
- To verify the app end-to-end, start a workout from the home screen and log a set (weight/reps/RPE, then "Done"); a completed workout is only saved to Progress/history after finishing all exercises in the workout.
