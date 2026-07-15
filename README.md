# FORMA — Progressive Overload Trial

This update adds an automatic progressive-overload coach to the working FORMA foundation.

## What changes

For every exercise, FORMA now:

- Reads the most recent completed session
- Shows the last-session sets
- Creates a target before the workout starts
- Prefills the recommended load into all working sets
- Uses double progression for strength and hypertrophy work
- Holds the load when reps or RPE show the weight is not yet mastered
- Increases load only after all completed sets reach the top of the range
- Uses smaller load jumps for conditioning movements
- Supports bodyweight, assisted and manually programmed exercises
- Lets you set the progression type and load increment in the workout builder

## Trial logic

Example for an 8–10 rep hypertrophy exercise:

- All completed sets reach 10 reps at RPE 9 or below → increase next session
- Sets remain within 8–10 but not all reach 10 → keep load and add reps
- Half or more sets fall below 8, or average RPE is 9.5+ → hold the load and rebuild reps

This is a coaching aid, not a requirement to push through pain, illness or poor technique.

## Upload this update

The easiest route is to replace these four files in the existing working GitHub repository:

```text
components/WorkoutApp.tsx
lib/types.ts
lib/defaults.ts
app/globals.css
```

Commit directly to `main`. Vercel should deploy automatically using your existing working pnpm/Corepack settings.

The full package also includes `package.json` with:

```json
"packageManager": "pnpm@10.12.1"
```

Do not turn the Vercel Install Command override back on.
