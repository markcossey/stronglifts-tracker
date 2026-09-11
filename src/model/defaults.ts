import type { LiftId, LiftState, RepScheme, Units } from './types'

export const ALL_LIFTS: LiftId[] = ['squat', 'bench', 'row', 'ohp', 'deadlift']

export const WORKOUT_A_LIFTS: LiftId[] = ['squat', 'bench', 'row']
export const WORKOUT_B_LIFTS: LiftId[] = ['squat', 'ohp', 'deadlift']

export const DEFAULT_INCREMENTS_KG: Record<LiftId, number> = {
  squat: 2.5,
  bench: 2.5,
  row: 2.5,
  ohp: 2.5,
  deadlift: 5,
}

export const DEFAULT_INCREMENTS_LB: Record<LiftId, number> = {
  squat: 5,
  bench: 5,
  row: 5,
  ohp: 5,
  deadlift: 10,
}

export const DEFAULT_STARTING_WEIGHTS_KG: Record<LiftId, number> = {
  squat: 20,
  bench: 20,
  row: 30,
  ohp: 20,
  deadlift: 40,
}

export const DEFAULT_STARTING_WEIGHTS_LB: Record<LiftId, number> = {
  squat: 45,
  bench: 45,
  row: 65,
  ohp: 45,
  deadlift: 95,
}

export const DELOAD_PERCENTAGE = 0.10
export const MAX_FAILURES_BEFORE_DELOAD = 3
export const MAX_DELOADS_BEFORE_SCHEME_CHANGE = 3

export const LIFT_DISPLAY_NAMES: Record<LiftId, string> = {
  squat: 'Squat',
  bench: 'Bench Press',
  row: 'Barbell Row',
  ohp: 'Overhead Press',
  deadlift: 'Deadlift',
}

export const REP_SCHEME_CONFIG: Record<RepScheme, { sets: number; reps: number }> = {
  '5x5': { sets: 5, reps: 5 },
  '3x5': { sets: 3, reps: 5 },
  '3x3': { sets: 3, reps: 3 },
  '1x5': { sets: 1, reps: 5 },
}

export const DEADLIFT_DEFAULT_SCHEME: RepScheme = '1x5'

export function createDefaultLiftState(weight: number): LiftState {
  return {
    currentWeight: weight,
    failureCount: 0,
    deloadCount: 0,
    status: 'progressing',
    repScheme: '5x5',
  }
}

export function getDefaultIncrements(units: Units): Record<LiftId, number> {
  return units === 'kg' ? { ...DEFAULT_INCREMENTS_KG } : { ...DEFAULT_INCREMENTS_LB }
}

export function getDefaultStartingWeights(units: Units): Record<LiftId, number> {
  return units === 'kg' ? { ...DEFAULT_STARTING_WEIGHTS_KG } : { ...DEFAULT_STARTING_WEIGHTS_LB }
}
