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

### Live app

The app is live at **https://lifts.markcossey.co.uk** and deploys automatically on every push to
`main`. Data is stored on each device and kept in sync across devices by a small PHP API on the
same hosting. See [DEPLOYMENT.md](DEPLOYMENT.md) for how deploys and sync work.

## What it does

- **Tracks workouts** — alternates Workout A (Squat, Bench, Row) and Workout B (Squat, OHP, Deadlift) automatically
- **Applies StrongLifts progression** — increases weight after successful workouts, handles failures, deloads, and rep scheme changes
- **Fast logging** — tap circles to record completed/failed sets
- **Progress charts** — weight over time for each lift with success/failure markers
- **Personal records** — tracks your best successful weight for each lift
- **Export/import** — backup and restore data as JSON, export history as CSV
- **Sync across devices** — enter a passcode once per device; works offline and catches up later

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
    useSync.ts          Syncs app state with the server API
  sync/
    api.ts              Calls to the sync API
    merge.ts            Combines changes made on two devices
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
    SyncPanel.tsx       Sync status and passcode form
  ui/
    Button.tsx          Reusable button component
    SetButton.tsx       Tappable set circle (pending/complete/failed)
    StatusBadge.tsx     Lift status indicator
    NavBar.tsx          Bottom tab navigation
server/
  api/                  PHP sync API (deployed to /api)
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
- localStorage on each device, synced via a PHP + MariaDB API

## Credits

Lift illustrations in the Technique tab are by [Everkinetic](https://everkinetic.com), used under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) via the
[workout-guide](https://github.com/bryllim/workout-guide) SVG set. The files in `public/lifts/` are
unmodified.
