# FORMA — Workout Foundation

A clean, build-tested Next.js workout app.

## Build status

This package was tested with:

- Next.js 16.2.10
- React 19.2.0
- Node.js 22
- `npm install`
- `npm run build`

The production build completed successfully before this ZIP was created.

## Included

- Water · Winter visual theme
- Your five-session weekly training structure
- Editable workout titles, days, duration, focus and exercises
- Add or remove workouts
- Add or remove exercises
- Start today’s scheduled workout
- Start any workout manually
- Weight, repetitions and RPE logging for every set
- Add or remove sets during a live workout
- Previous-weight display
- Last-used weight carried into the next session
- 60, 90, 120 and 180-second rest timers
- Live completion percentage
- Session notes
- Workout duration
- Workout history
- Local browser saving
- Mobile-responsive layout

## Fresh GitHub setup

Create a brand-new empty repository.

Upload everything inside this folder to the repository root. GitHub should show:

```text
app/
components/
lib/
public/
.gitignore
next-env.d.ts
next.config.ts
package.json
package-lock.json
README.md
tsconfig.json
```

Do not upload the outer `FORMA_Foundation_Clean` folder as a nested folder.

## Vercel setup

1. Add a new Vercel project.
2. Import the new GitHub repository.
3. Framework preset: Next.js.
4. Root directory: `./`
5. Build command: leave as default.
6. Output directory: leave as default.
7. Deploy.

## Local use

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Current storage

This alpha saves data in the browser on the current device. Cloud accounts and cross-device sync come later.
