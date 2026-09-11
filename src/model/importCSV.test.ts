import { describe, test, expect } from 'vitest'
import type { AppState } from './types'
import { importStrongLiftsCSV } from './importCSV'
import { getPersonalRecord } from './programme'

const HEADER = 'Date (yyyy/mm/dd),Workout,Workout Name,Program Name,Body Weight (LB),Exercise,Sets×Reps,Sets×Time,Top Set (Reps×KG),e1RM (KG),Reps,Volume (KG),Workout Volume (KG),Duration (hours),Start Time (h:mm),End Time (h:mm),Notes,Set 1 (Reps),Set 1 (KG),Set 2 (Reps),Set 2 (KG),Set 3 (Reps),Set 3 (KG),Set 4 (Reps),Set 4 (KG),Set 5 (Reps),Set 5 (KG)'

function row(
  date: string,
  num: number,
  name: string,
  exercise: string,
  setsReps: string,
  sets: [number, number][],
): string {
  return [
    date, String(num), `"${name}"`, '"Stronglifts 5×5"', '180', `"${exercise}"`, setsReps,
    '', '', '', '', '', '', '',
    '8:00 am', '8:45 am', '""',
    ...sets.flatMap(([reps, weight]) => [String(reps), String(weight)]),
  ].join(',')
}

function sets(weight: number, reps = [5, 5, 5, 5, 5]): [number, number][] {
  return reps.map(r => [r, weight])
}

function importOrThrow(csv: string): AppState {
  const result = importStrongLiftsCSV(csv)
  if ('error' in result) throw new Error(result.error)
  return result
}

describe('StrongLifts CSV import', () => {
  const csv = [
    HEADER,
    row('2026/09/01', 1, 'Workout A', 'Squat', '5×5', sets(80)),
    row('2026/09/01', 1, 'Workout A', 'Bench Press', '5×5', sets(65)),
    row('2026/09/01', 1, 'Workout A', 'Barbell Row', '5×5', sets(45)),
    row('2026/09/03', 2, 'Workout B', 'Squat', '5×5', sets(82.5)),
    row('2026/09/03', 2, 'Workout B', 'Overhead Press', '5/5/4/4/3', sets(40, [5, 5, 4, 4, 3])),
    row('2026/09/03', 2, 'Workout B', 'Deadlift', '1×5', [[5, 100]]),
    row('2026/09/05', 3, 'Workout A', 'Squat', '5×5', sets(85)),
    row('2026/09/05', 3, 'Workout A', 'Bench Press', '5/5/5/4/4', sets(67.5, [5, 5, 5, 4, 4])),
    row('2026/09/05', 3, 'Workout A', 'Barbell Row', 'Skipped', sets(46, [0, 0, 0, 0, 0])),
  ].join('\n')

  test('successful last session prescribes the next weight up', () => {
    const state = importOrThrow(csv)
    expect(state.lifts.squat.currentWeight).toBe(87.5)
    expect(state.lifts.deadlift.currentWeight).toBe(105)
    expect(state.lifts.squat.status).toBe('progressing')
  })

  test('failed last session repeats the weight and counts the failure', () => {
    const state = importOrThrow(csv)
    expect(state.lifts.bench.currentWeight).toBe(67.5)
    expect(state.lifts.bench.failureCount).toBe(1)
    expect(state.lifts.ohp.currentWeight).toBe(40)
    expect(state.lifts.ohp.failureCount).toBe(1)
  })

  test('skipped sessions are ignored when working out the next weight', () => {
    const state = importOrThrow(csv)
    expect(state.lifts.row.currentWeight).toBe(47.5)
  })

  test('next workout alternates from the last imported workout', () => {
    expect(importOrThrow(csv).nextWorkoutType).toBe('B')
  })

  test('personal records only count completed sessions', () => {
    const state = importOrThrow(csv)
    expect(getPersonalRecord(state.workouts, 'bench')?.weight).toBe(65)
  })

  test('three consecutive failures at the same weight deload', () => {
    const failing = [
      HEADER,
      row('2026/09/01', 1, 'Workout B', 'Overhead Press', '5/5/4/4/3', sets(40, [5, 5, 4, 4, 3])),
      row('2026/09/03', 2, 'Workout B', 'Overhead Press', '5/5/4/4/3', sets(40, [5, 5, 4, 4, 3])),
      row('2026/09/05', 3, 'Workout B', 'Overhead Press', '5/5/4/4/3', sets(40, [5, 5, 4, 4, 3])),
    ].join('\n')

    const state = importOrThrow(failing)
    expect(state.lifts.ohp.currentWeight).toBe(35)
    expect(state.lifts.ohp.failureCount).toBe(0)
    expect(state.lifts.ohp.status).toBe('deloading')
  })
})
