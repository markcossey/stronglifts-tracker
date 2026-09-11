# StrongLifts 5×5 Tracker

A simple, mobile-first web app for tracking StrongLifts 5×5 workouts. Built for one person — fast workout logging, accurate progression, no fluff.

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in your terminal (usually http://localhost:5173).

### Access from your phone

Start the dev server with network access:

```bash
npm run dev -- --host
```

Then open the **Network** URL (e.g. `http://192.168.x.x:5173`) on your phone. Both devices must be on the same Wi-Fi network.

### Deploy for real

Build the static files and host them anywhere (Netlify, Vercel, GitHub Pages, etc.):

```bash
npm run build
```

Output goes to `dist/`. All data is stored in the browser's localStorage — there is no backend.

## What it does

- **Tracks workouts** — alternates Workout A (Squat, Bench, Row) and Workout B (Squat, OHP, Deadlift) automatically
- **Applies StrongLifts progression** — increases weight after successful workouts, handles failures, deloads, and rep scheme changes
- **Fast logging** — tap circles to record completed/failed sets
- **Progress charts** — weight over time for each lift with success/failure markers
- **Personal records** — tracks your best successful weight for each lift
- **Export/import** — backup and restore data as JSON, export history as CSV

## StrongLifts rules implemented

| Rule | Detail |
|------|--------|
| Success | All reps completed → weight increases next session |
| Failure | Missed reps → same weight next session |
| Deload | 3 consecutive failures → reduce weight by 10% |
| Scheme change | 3 deloads on same lift → 5×5 → 3×5 → 3×3 → 1×5 |
| Deadlift | Always 1×5, default increment 5 kg / 10 lb |

## Project structure

```
src/
  model/
    types.ts            Type definitions
    defaults.ts         Constants, default weights, lift configs
    programme.ts        StrongLifts state machine (pure functions, no React)
    programme.test.ts   21 tests covering progression logic
  hooks/
    useAppState.ts      React hook wrapping localStorage persistence
  components/
    App.tsx             Root component with tab navigation
    Setup.tsx           First-run setup wizard
    Today.tsx           Current workout overview
    WorkoutEntry.tsx    Active workout recording
    WorkoutSummary.tsx  Post-workout summary
    Dashboard.tsx       Current lifts status table
    History.tsx         Workout history list
    WorkoutDetail.tsx   Single workout view/edit
    Progress.tsx        Charts and stats container
    LiftChart.tsx       Weight-over-time chart (Recharts)
    PRSection.tsx       Personal records display
    Settings.tsx        Configuration and data management
  ui/
    Button.tsx          Reusable button component
    SetButton.tsx       Tappable set circle (pending/complete/failed)
    StatusBadge.tsx     Lift status indicator
    NavBar.tsx          Bottom tab navigation
```

The programme logic in `src/model/programme.ts` is completely separate from React — pure functions that take state and return new state. All 21 tests run against this layer.

## Tests

```bash
npm test        # watch mode
npm run test:run # single run
```

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Recharts
- Vitest
- localStorage (no backend)
