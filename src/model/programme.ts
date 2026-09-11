import type {
  AppState,
  ExerciseResult,
  LiftId,
  LiftState,
  PrescribedWorkout,
  RepScheme,
  Units,
  Workout,
  WorkoutType,
} from './types'
import {
  ALL_LIFTS,
  DEADLIFT_DEFAULT_SCHEME,
  DELOAD_PERCENTAGE,
  MAX_DELOADS_BEFORE_SCHEME_CHANGE,
  MAX_FAILURES_BEFORE_DELOAD,
  REP_SCHEME_CONFIG,
  WORKOUT_A_LIFTS,
  WORKOUT_B_LIFTS,
  createDefaultLiftState,
  getDefaultIncrements,
} from './defaults'

export function getLiftsForWorkout(type: WorkoutType): LiftId[] {
  return type === 'A' ? WORKOUT_A_LIFTS : WORKOUT_B_LIFTS
}

export function getRepSchemeForLift(liftId: LiftId, liftState: LiftState): RepScheme {
  if (liftId === 'deadlift') return DEADLIFT_DEFAULT_SCHEME
  return liftState.repScheme
}

export function roundToIncrement(weight: number, increment: number): number {
  return Math.floor(weight / increment) * increment
}

export function calculateDeloadWeight(currentWeight: number, increment: number): number {
  const deloaded = currentWeight * (1 - DELOAD_PERCENTAGE)
  return roundToIncrement(deloaded, increment)
}

export function degradeRepScheme(current: RepScheme): RepScheme {
  const chain: RepScheme[] = ['5x5', '3x5', '3x3', '1x5']
  const idx = chain.indexOf(current)
  if (idx === -1 || idx === chain.length - 1) return current
  return chain[idx + 1]
}

export function isExerciseComplete(exercise: ExerciseResult): boolean {
  return exercise.sets.every(s => s.completed)
}

export function getWorkoutPrescription(state: AppState): PrescribedWorkout {
  const lifts = getLiftsForWorkout(state.nextWorkoutType)
  return {
    type: state.nextWorkoutType,
    exercises: lifts.map(liftId => {
      const liftState = state.lifts[liftId]
      const scheme = getRepSchemeForLift(liftId, liftState)
      const config = REP_SCHEME_CONFIG[scheme]
      return {
        liftId,
        weight: liftState.currentWeight,
        sets: config.sets,
        reps: config.reps,
        repScheme: scheme,
      }
    }),
  }
}

export function processLiftResult(
  liftState: LiftState,
  exercise: ExerciseResult,
  increment: number,
  liftId: LiftId,
): LiftState {
  // prescribedWeight holds the weight actually lifted, including any in-workout adjustment
  const liftedWeight = exercise.prescribedWeight

  if (isExerciseComplete(exercise)) {
    return {
      ...liftState,
      currentWeight: liftedWeight + increment,
      failureCount: 0,
      status: 'progressing',
    }
  }

  const priorFailures = liftedWeight === liftState.currentWeight ? liftState.failureCount : 0
  const newFailureCount = priorFailures + 1

  if (newFailureCount >= MAX_FAILURES_BEFORE_DELOAD) {
    const newDeloadCount = liftState.deloadCount + 1
    const deloadedWeight = calculateDeloadWeight(liftedWeight, increment)

    if (newDeloadCount >= MAX_DELOADS_BEFORE_SCHEME_CHANGE) {
      const currentScheme = getRepSchemeForLift(liftId, liftState)
      const newScheme = degradeRepScheme(currentScheme)
      return {
        ...liftState,
        currentWeight: deloadedWeight,
        failureCount: 0,
        deloadCount: liftId === 'deadlift' ? newDeloadCount : 0,
        status: 'deloading',
        repScheme: liftId === 'deadlift' ? liftState.repScheme : newScheme,
      }
    }

    return {
      ...liftState,
      currentWeight: deloadedWeight,
      failureCount: 0,
      deloadCount: newDeloadCount,
      status: 'deloading',
    }
  }

  return {
    ...liftState,
    currentWeight: liftedWeight,
    failureCount: newFailureCount,
    status: newFailureCount >= 2 ? 'stalled' : 'failed',
  }
}

export function processWorkoutResult(state: AppState, workout: Workout): AppState {
  const newLifts = { ...state.lifts }

  for (const exercise of workout.exercises) {
    const liftId = exercise.liftId
    newLifts[liftId] = processLiftResult(
      state.lifts[liftId],
      exercise,
      state.increments[liftId],
      liftId,
    )
  }

  return {
    ...state,
    lifts: newLifts,
    nextWorkoutType: workout.type === 'A' ? 'B' : 'A',
    workouts: [...state.workouts, workout],
    lastWorkoutUndo: {
      workoutId: workout.id,
      lifts: state.lifts,
      nextWorkoutType: state.nextWorkoutType,
    },
  }
}

export function updateWorkoutInHistory(
  state: AppState,
  workoutId: string,
  updatedWorkout: Workout,
): AppState {
  return {
    ...state,
    workouts: state.workouts.map(w => (w.id === workoutId ? updatedWorkout : w)),
  }
}

export function canUndoWorkout(state: AppState, workoutId: string): boolean {
  return state.lastWorkoutUndo?.workoutId === workoutId
}

export function deleteWorkoutFromHistory(
  state: AppState,
  workoutId: string,
): AppState {
  const workouts = state.workouts.filter(w => w.id !== workoutId)
  const undo = state.lastWorkoutUndo
  if (undo?.workoutId === workoutId) {
    return {
      ...state,
      workouts,
      lifts: undo.lifts,
      nextWorkoutType: undo.nextWorkoutType,
      lastWorkoutUndo: undefined,
    }
  }
  return { ...state, workouts }
}

export function convertWeight(weight: number, from: Units, to: Units): number {
  if (from === to) return weight
  if (from === 'kg' && to === 'lb') return Math.round(weight * 2.20462 * 10) / 10
  return Math.round((weight / 2.20462) * 10) / 10
}

export function convertStateUnits(state: AppState, to: Units): AppState {
  const from = state.units
  if (from === to) return state

  const plateStep = to === 'kg' ? 2.5 : 5
  const lifts = { ...state.lifts }
  for (const liftId of ALL_LIFTS) {
    const converted = convertWeight(state.lifts[liftId].currentWeight, from, to)
    lifts[liftId] = { ...state.lifts[liftId], currentWeight: Math.round(converted / plateStep) * plateStep }
  }

  return {
    ...state,
    units: to,
    lifts,
    increments: getDefaultIncrements(to),
    workouts: state.workouts.map(w => ({
      ...w,
      exercises: w.exercises.map(e => ({
        ...e,
        prescribedWeight: convertWeight(e.prescribedWeight, from, to),
      })),
    })),
    bodyWeights: state.bodyWeights?.map(e => ({ ...e, weight: convertWeight(e.weight, from, to) })),
    lastWorkoutUndo: undefined,
  }
}

export function createAppState(
  units: Units,
  startingWeights: Record<LiftId, number>,
): AppState {
  const lifts = {} as Record<LiftId, LiftState>
  for (const liftId of ALL_LIFTS) {
    lifts[liftId] = createDefaultLiftState(startingWeights[liftId])
  }

  return {
    version: 1,
    units,
    setupComplete: true,
    nextWorkoutType: 'A',
    lifts,
    increments: getDefaultIncrements(units),
    workouts: [],
  }
}

export function exportData(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function importData(json: string): AppState | { error: string } {
  try {
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') {
      return { error: 'Invalid data format' }
    }
    if (!parsed.version || !parsed.units || !parsed.lifts || !Array.isArray(parsed.workouts)) {
      return { error: 'Missing required fields' }
    }
    for (const liftId of ALL_LIFTS) {
      if (!parsed.lifts[liftId]) {
        return { error: `Missing lift data for ${liftId}` }
      }
    }
    return parsed as AppState
  } catch {
    return { error: 'Invalid JSON' }
  }
}

export function getWorkoutStats(workouts: Workout[]) {
  const successful = workouts.filter(w => w.exercises.every(isExerciseComplete)).length
  return { successful, failed: workouts.length - successful, total: workouts.length }
}

// Epley formula
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export function getLiftHistory(workouts: Workout[], liftId: LiftId) {
  return workouts
    .filter(w => w.exercises.some(e => e.liftId === liftId))
    .map(w => {
      const exercise = w.exercises.find(e => e.liftId === liftId)!
      const weight = exercise.prescribedWeight
      return {
        date: w.date,
        weight,
        completed: isExerciseComplete(exercise),
        sets: exercise.sets,
        e1rm: Math.max(0, ...exercise.sets.map(s => estimateOneRepMax(weight, s.reps))),
        volume: exercise.sets.reduce((sum, s) => sum + s.reps * weight, 0),
      }
    })
}

export function getPersonalRecord(
  workouts: Workout[],
  liftId: LiftId,
): { weight: number; date: string } | null {
  let best: { weight: number; date: string } | null = null
  for (const h of getLiftHistory(workouts, liftId)) {
    if (h.completed && (!best || h.weight > best.weight)) {
      best = { weight: h.weight, date: h.date }
    }
  }
  return best
}

export interface LiftRecord {
  value: number
  date: string
}

export function getLiftRecords(workouts: Workout[], liftId: LiftId) {
  const history = getLiftHistory(workouts, liftId)
  const heaviestSession = getPersonalRecord(workouts, liftId)
  let bestE1RM: LiftRecord | null = null
  let bestVolume: LiftRecord | null = null

  for (const h of history) {
    if (h.e1rm > 0 && (!bestE1RM || h.e1rm > bestE1RM.value)) bestE1RM = { value: h.e1rm, date: h.date }
    if (h.volume > 0 && (!bestVolume || h.volume > bestVolume.value)) bestVolume = { value: h.volume, date: h.date }
  }

  return {
    heaviest: heaviestSession ? { value: heaviestSession.weight, date: heaviestSession.date } : null,
    bestE1RM,
    bestVolume,
    sessions: history.length,
    completedSessions: history.filter(h => h.completed).length,
  }
}

export interface PlateResult {
  perSide: { weight: number; count: number }[]
  barWeight: number
  totalWeight: number
  loadedWeight: number
  isBarOnly: boolean
}

export function calculatePlates(
  totalWeight: number,
  units: Units,
): PlateResult {
  const barWeight = units === 'kg' ? 20 : 45
  const availablePlates = units === 'kg'
    ? [25, 20, 10, 5, 2.5, 1.25, 0.5]
    : [45, 35, 25, 10, 5, 2.5]

  if (totalWeight <= barWeight) {
    return { perSide: [], barWeight, totalWeight, loadedWeight: barWeight, isBarOnly: true }
  }

  let remaining = (totalWeight - barWeight) / 2
  const perSide: { weight: number; count: number }[] = []

  for (const plate of availablePlates) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate)
      perSide.push({ weight: plate, count })
      remaining -= count * plate
    }
  }

  const loadedPerSide = perSide.reduce((sum, p) => sum + p.weight * p.count, 0)
  return { perSide, barWeight, totalWeight, loadedWeight: barWeight + 2 * loadedPerSide, isBarOnly: false }
}

export function exportCSV(state: AppState): string {
  const rows: string[] = ['Date,Workout,Exercise,Weight,Sets,Reps Completed,Status,Notes']

  for (const workout of state.workouts) {
    for (const exercise of workout.exercises) {
      const totalSets = exercise.sets.length
      const completedReps = exercise.sets.map(s => s.reps).join('/')
      const status = isExerciseComplete(exercise) ? 'Completed' : 'Failed'
      const notes = (exercise.notes ?? workout.notes ?? '').replace(/,/g, ';')
      rows.push(
        `${workout.date},${workout.type},${exercise.liftId},${exercise.prescribedWeight} ${state.units},${totalSets},${completedReps},${status},${notes}`,
      )
    }
  }

  return rows.join('\n')
}
