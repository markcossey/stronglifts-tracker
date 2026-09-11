import { describe, test, expect } from 'vitest'
import type { AppState, ExerciseResult, LiftId, SetResult, Workout } from './types'
import {
  calculateDeloadWeight,
  convertWeight,
  createAppState,
  degradeRepScheme,
  exportData,
  getLiftsForWorkout,
  getPersonalRecord,
  getWorkoutPrescription,
  importData,
  isExerciseComplete,
  processWorkoutResult,
  roundToIncrement,
  updateWorkoutInHistory,
} from './programme'
import { DEFAULT_STARTING_WEIGHTS_KG } from './defaults'

function makeCompletedSets(count: number, reps: number): SetResult[] {
  return Array.from({ length: count }, () => ({
    reps,
    targetReps: reps,
    completed: true,
  }))
}

function makeFailedSets(
  totalSets: number,
  targetReps: number,
  failAtSet: number,
  failedReps: number,
): SetResult[] {
  return Array.from({ length: totalSets }, (_, i) => {
    if (i < failAtSet) {
      return { reps: targetReps, targetReps, completed: true }
    }
    if (i === failAtSet) {
      return { reps: failedReps, targetReps, completed: false }
    }
    return { reps: 0, targetReps, completed: false }
  })
}

function makeSuccessfulExercise(liftId: LiftId, weight: number, sets = 5, reps = 5): ExerciseResult {
  return {
    liftId,
    prescribedWeight: weight,
    sets: makeCompletedSets(sets, reps),
  }
}

function makeFailedExercise(
  liftId: LiftId,
  weight: number,
  failAtSet: number,
  failedReps: number,
  totalSets = 5,
  targetReps = 5,
): ExerciseResult {
  return {
    liftId,
    prescribedWeight: weight,
    sets: makeFailedSets(totalSets, targetReps, failAtSet, failedReps),
  }
}

function makeWorkout(
  state: AppState,
  exercises: ExerciseResult[],
  dateOffset = 0,
): Workout {
  const date = new Date(2024, 0, 1 + dateOffset).toISOString().split('T')[0]
  return {
    id: `workout-${dateOffset}`,
    date,
    type: state.nextWorkoutType,
    exercises,
  }
}

function createTestState(overrides?: Partial<{
  squat: number
  bench: number
  row: number
  ohp: number
  deadlift: number
}>): AppState {
  const weights = { ...DEFAULT_STARTING_WEIGHTS_KG, ...overrides }
  return createAppState('kg', weights)
}

describe('StrongLifts Programme State Machine', () => {
  test('1. Successful workout increases weight by configured increment', () => {
    const state = createTestState({ squat: 60 })
    const prescription = getWorkoutPrescription(state)
    expect(prescription.type).toBe('A')

    const workout = makeWorkout(state, [
      makeSuccessfulExercise('squat', 60),
      makeSuccessfulExercise('bench', 20),
      makeSuccessfulExercise('row', 30),
    ])

    const newState = processWorkoutResult(state, workout)

    expect(newState.lifts.squat.currentWeight).toBe(62.5)
    expect(newState.lifts.squat.status).toBe('progressing')
    expect(newState.lifts.bench.currentWeight).toBe(22.5)
    expect(newState.lifts.row.currentWeight).toBe(32.5)
  })

  test('2. Failed workout keeps weight the same', () => {
    const state = createTestState({ bench: 50 })
    const workout = makeWorkout(state, [
      makeSuccessfulExercise('squat', 20),
      makeFailedExercise('bench', 50, 3, 3),
      makeSuccessfulExercise('row', 30),
    ])

    const newState = processWorkoutResult(state, workout)

    expect(newState.lifts.bench.currentWeight).toBe(50)
    expect(newState.lifts.bench.failureCount).toBe(1)
    expect(newState.lifts.bench.status).toBe('failed')
  })

  test('3. Three consecutive failures trigger 10% deload', () => {
    let state = createTestState({ row: 70 })

    for (let i = 0; i < 3; i++) {
      const workout = makeWorkout(state, [
        makeSuccessfulExercise('squat', state.lifts.squat.currentWeight),
        makeSuccessfulExercise('bench', state.lifts.bench.currentWeight),
        makeFailedExercise('row', 70, 4, 3),
      ], i)
      state = processWorkoutResult(state, workout)
    }

    // 70 * 0.9 = 63, already on 2.5 increment
    expect(state.lifts.row.currentWeight).toBe(62.5)
    expect(state.lifts.row.failureCount).toBe(0)
    expect(state.lifts.row.deloadCount).toBe(1)
    expect(state.lifts.row.status).toBe('deloading')
  })

  test('4. Successful progression after deload', () => {
    let state = createTestState({ ohp: 40 })
    let day = 0

    // Fail OHP 3 times to trigger deload. OHP is only in Workout B,
    // so we must complete A workouts in between.
    let ohpFailures = 0
    while (ohpFailures < 3) {
      const lifts = getLiftsForWorkout(state.nextWorkoutType)
      const exercises = lifts.map(liftId => {
        if (liftId === 'ohp') {
          return makeFailedExercise('ohp', state.lifts.ohp.currentWeight, 3, 2)
        }
        if (liftId === 'deadlift') {
          return makeSuccessfulExercise(liftId, state.lifts[liftId].currentWeight, 1, 5)
        }
        return makeSuccessfulExercise(liftId, state.lifts[liftId].currentWeight)
      })
      if (state.nextWorkoutType === 'B') ohpFailures++
      state = processWorkoutResult(state, makeWorkout(state, exercises, day++))
    }

    expect(state.lifts.ohp.status).toBe('deloading')
    const deloadedWeight = state.lifts.ohp.currentWeight
    expect(deloadedWeight).toBe(35) // 40 * 0.9 = 36, rounded to 35

    // Complete workouts until we reach a B workout to test OHP progression
    while (state.nextWorkoutType !== 'B') {
      const lifts = getLiftsForWorkout(state.nextWorkoutType)
      const exercises = lifts.map(liftId =>
        makeSuccessfulExercise(liftId, state.lifts[liftId].currentWeight,
          liftId === 'deadlift' ? 1 : 5, 5),
      )
      state = processWorkoutResult(state, makeWorkout(state, exercises, day++))
    }

    // Now succeed at deloaded weight in a B workout
    const lifts = getLiftsForWorkout(state.nextWorkoutType)
    const exercises = lifts.map(liftId =>
      makeSuccessfulExercise(liftId, state.lifts[liftId].currentWeight,
        liftId === 'deadlift' ? 1 : 5, 5),
    )
    state = processWorkoutResult(state, makeWorkout(state, exercises, day++))

    expect(state.lifts.ohp.status).toBe('progressing')
    expect(state.lifts.ohp.currentWeight).toBe(deloadedWeight + 2.5)
    expect(state.lifts.ohp.failureCount).toBe(0)
  })

  test('5. Workout A/B alternation', () => {
    let state = createTestState()

    expect(state.nextWorkoutType).toBe('A')
    expect(getLiftsForWorkout('A')).toEqual(['squat', 'bench', 'row'])
    expect(getLiftsForWorkout('B')).toEqual(['squat', 'ohp', 'deadlift'])

    // Complete workout A
    const workoutA = makeWorkout(state, [
      makeSuccessfulExercise('squat', 20),
      makeSuccessfulExercise('bench', 20),
      makeSuccessfulExercise('row', 30),
    ], 0)
    state = processWorkoutResult(state, workoutA)
    expect(state.nextWorkoutType).toBe('B')

    // Complete workout B
    const workoutB = makeWorkout(state, [
      makeSuccessfulExercise('squat', state.lifts.squat.currentWeight),
      makeSuccessfulExercise('ohp', 20),
      makeSuccessfulExercise('deadlift', 40, 1, 5),
    ], 1)
    state = processWorkoutResult(state, workoutB)
    expect(state.nextWorkoutType).toBe('A')
  })

  test('6. Unit conversion kg to lb and back', () => {
    expect(convertWeight(100, 'kg', 'lb')).toBeCloseTo(220.5, 0)
    expect(convertWeight(225, 'lb', 'kg')).toBeCloseTo(102.1, 0)

    const original = 80
    const toLb = convertWeight(original, 'kg', 'lb')
    const backToKg = convertWeight(toLb, 'lb', 'kg')
    expect(backToKg).toBeCloseTo(original, 0)

    expect(convertWeight(50, 'kg', 'kg')).toBe(50)
  })

  test('7. Editing historical workout does not corrupt current state', () => {
    let state = createTestState({ squat: 60 })

    // Do 5 workouts
    for (let i = 0; i < 5; i++) {
      const lifts = getLiftsForWorkout(state.nextWorkoutType)
      const exercises = lifts.map(liftId =>
        makeSuccessfulExercise(liftId, state.lifts[liftId].currentWeight,
          liftId === 'deadlift' ? 1 : 5, 5),
      )
      state = processWorkoutResult(state, makeWorkout(state, exercises, i))
    }

    const squatWeight = state.lifts.squat.currentWeight
    const benchWeight = state.lifts.bench.currentWeight
    const nextWorkout = state.nextWorkoutType

    // Edit workout #2's notes
    const editedWorkout = {
      ...state.workouts[1],
      notes: 'Edited note',
      exercises: state.workouts[1].exercises.map(e => ({ ...e, notes: 'test' })),
    }
    const editedState = updateWorkoutInHistory(state, state.workouts[1].id, editedWorkout)

    expect(editedState.lifts.squat.currentWeight).toBe(squatWeight)
    expect(editedState.lifts.bench.currentWeight).toBe(benchWeight)
    expect(editedState.nextWorkoutType).toBe(nextWorkout)
    expect(editedState.workouts[1].notes).toBe('Edited note')
  })

  test('8. Changing increments affects next progression', () => {
    let state = createTestState({ squat: 80 })

    // Change squat increment to 1.25kg
    state = { ...state, increments: { ...state.increments, squat: 1.25 } }

    const workout = makeWorkout(state, [
      makeSuccessfulExercise('squat', 80),
      makeSuccessfulExercise('bench', 20),
      makeSuccessfulExercise('row', 30),
    ])
    state = processWorkoutResult(state, workout)

    expect(state.lifts.squat.currentWeight).toBe(81.25)
  })

  test('9. Starting with existing/custom weights', () => {
    const customWeights: Record<LiftId, number> = {
      squat: 100,
      bench: 75,
      row: 70,
      ohp: 45,
      deadlift: 120,
    }
    const state = createAppState('kg', customWeights)

    const prescription = getWorkoutPrescription(state)
    expect(prescription.exercises[0].weight).toBe(100) // squat
    expect(prescription.exercises[1].weight).toBe(75)  // bench
    expect(prescription.exercises[2].weight).toBe(70)  // row

    // Progress from custom weights
    const workout = makeWorkout(state, [
      makeSuccessfulExercise('squat', 100),
      makeSuccessfulExercise('bench', 75),
      makeSuccessfulExercise('row', 70),
    ])
    const newState = processWorkoutResult(state, workout)

    expect(newState.lifts.squat.currentWeight).toBe(102.5)
    expect(newState.lifts.bench.currentWeight).toBe(77.5)
    expect(newState.lifts.row.currentWeight).toBe(72.5)
  })

  test('10. State serialization and deserialization round-trips', () => {
    let state = createTestState({ squat: 60 })

    // Do a couple workouts to have history
    for (let i = 0; i < 3; i++) {
      const lifts = getLiftsForWorkout(state.nextWorkoutType)
      const exercises = lifts.map(liftId =>
        makeSuccessfulExercise(liftId, state.lifts[liftId].currentWeight,
          liftId === 'deadlift' ? 1 : 5, 5),
      )
      state = processWorkoutResult(state, makeWorkout(state, exercises, i))
    }

    const json = exportData(state)
    const imported = importData(json)

    expect('error' in imported).toBe(false)
    expect(imported).toEqual(state)
  })

  // --- Additional edge-case tests ---

  test('Deadlift uses 1x5 scheme and 5kg increments by default', () => {
    const state = createTestState()
    const prescription = getWorkoutPrescription({ ...state, nextWorkoutType: 'B' })

    const deadlift = prescription.exercises.find(e => e.liftId === 'deadlift')!
    expect(deadlift.sets).toBe(1)
    expect(deadlift.reps).toBe(5)
    expect(deadlift.repScheme).toBe('1x5')
    expect(state.increments.deadlift).toBe(5)
  })

  test('Triple deload triggers rep scheme degradation (5x5 -> 3x5)', () => {
    let state = createTestState({ bench: 80 })
    let day = 0

    // Need 3 deloads = 9 consecutive bench failures.
    // Bench only appears in Workout A, so we must do B workouts in between.
    let benchFailures = 0
    while (benchFailures < 9) {
      const lifts = getLiftsForWorkout(state.nextWorkoutType)
      const exercises = lifts.map(liftId => {
        if (liftId === 'bench') {
          return makeFailedExercise('bench', state.lifts.bench.currentWeight, 4, 3)
        }
        if (liftId === 'deadlift') {
          return makeSuccessfulExercise(liftId, state.lifts[liftId].currentWeight, 1, 5)
        }
        return makeSuccessfulExercise(liftId, state.lifts[liftId].currentWeight)
      })
      if (state.nextWorkoutType === 'A') benchFailures++
      state = processWorkoutResult(state, makeWorkout(state, exercises, day++))
    }

    expect(state.lifts.bench.repScheme).toBe('3x5')
    expect(state.lifts.bench.deloadCount).toBe(0)
  })

  test('Rep scheme degrades through full chain', () => {
    expect(degradeRepScheme('5x5')).toBe('3x5')
    expect(degradeRepScheme('3x5')).toBe('3x3')
    expect(degradeRepScheme('3x3')).toBe('1x5')
    expect(degradeRepScheme('1x5')).toBe('1x5')
  })

  test('Deload weight rounds to nearest valid increment', () => {
    // 97.5 * 0.9 = 87.75, with 2.5 increment should round to 87.5
    expect(calculateDeloadWeight(97.5, 2.5)).toBe(87.5)
    // 100 * 0.9 = 90, already on 2.5 increment
    expect(calculateDeloadWeight(100, 2.5)).toBe(90)
    // 105 * 0.9 = 94.5, with 5 increment should round to 90
    expect(calculateDeloadWeight(105, 5)).toBe(90)
  })

  test('roundToIncrement works correctly', () => {
    expect(roundToIncrement(87.75, 2.5)).toBe(87.5)
    expect(roundToIncrement(90, 2.5)).toBe(90)
    expect(roundToIncrement(94.5, 5)).toBe(90)
    expect(roundToIncrement(22, 2.5)).toBe(20)
  })

  test('Personal record is the heaviest completed weight, not the next prescribed weight', () => {
    const state = createTestState({ squat: 100 })
    expect(getPersonalRecord(state.workouts, 'squat')).toBeNull()

    const workout = makeWorkout(state, [
      makeSuccessfulExercise('squat', 100),
      makeSuccessfulExercise('bench', 20),
      makeSuccessfulExercise('row', 30),
    ])
    const newState = processWorkoutResult(state, workout)

    expect(newState.lifts.squat.currentWeight).toBe(102.5)
    expect(getPersonalRecord(newState.workouts, 'squat')).toEqual({ weight: 100, date: workout.date })
  })

  test('Failed attempts and deload recovery do not change the personal record', () => {
    let state = createTestState({ squat: 100 })
    state = processWorkoutResult(state, makeWorkout(state, [
      makeSuccessfulExercise('squat', 100),
      makeSuccessfulExercise('bench', 20),
      makeSuccessfulExercise('row', 30),
    ], 0))

    for (let i = 1; i <= 3; i++) {
      state = processWorkoutResult(state, makeWorkout(state, [
        makeFailedExercise('squat', state.lifts.squat.currentWeight, 4, 3),
      ], i))
    }
    expect(state.lifts.squat.status).toBe('deloading')

    state = processWorkoutResult(state, makeWorkout(state, [
      makeSuccessfulExercise('squat', state.lifts.squat.currentWeight),
    ], 4))

    expect(getPersonalRecord(state.workouts, 'squat')?.weight).toBe(100)
  })

  test('Next workout alternates from the workout actually performed', () => {
    const state = createTestState()
    expect(state.nextWorkoutType).toBe('A')

    const workoutB: Workout = {
      ...makeWorkout(state, [
        makeSuccessfulExercise('squat', 20),
        makeSuccessfulExercise('ohp', 20),
        makeSuccessfulExercise('deadlift', 40, 1, 5),
      ]),
      type: 'B',
    }
    const newState = processWorkoutResult(state, workoutB)

    expect(newState.nextWorkoutType).toBe('A')
  })

  test('Progression uses the weight actually lifted when adjusted mid-workout', () => {
    const state = createTestState({ squat: 60 })
    const newState = processWorkoutResult(state, makeWorkout(state, [
      makeSuccessfulExercise('squat', 65),
    ]))

    expect(newState.lifts.squat.currentWeight).toBe(67.5)
  })

  test('Failing at a different weight starts a new failure count at that weight', () => {
    let state = createTestState({ squat: 80 })
    for (let i = 0; i < 2; i++) {
      state = processWorkoutResult(state, makeWorkout(state, [
        makeFailedExercise('squat', 80, 4, 2),
      ], i))
    }
    expect(state.lifts.squat.failureCount).toBe(2)

    state = processWorkoutResult(state, makeWorkout(state, [
      makeFailedExercise('squat', 75, 4, 2),
    ], 2))

    expect(state.lifts.squat.currentWeight).toBe(75)
    expect(state.lifts.squat.failureCount).toBe(1)
    expect(state.lifts.squat.status).toBe('failed')
  })

  test('isExerciseComplete returns correct results', () => {
    expect(isExerciseComplete(makeSuccessfulExercise('squat', 100))).toBe(true)
    expect(isExerciseComplete(makeFailedExercise('squat', 100, 3, 3))).toBe(false)
  })

  test('getWorkoutPrescription returns correct exercises for A and B', () => {
    const state = createTestState()

    const prescriptionA = getWorkoutPrescription(state)
    expect(prescriptionA.type).toBe('A')
    expect(prescriptionA.exercises.map(e => e.liftId)).toEqual(['squat', 'bench', 'row'])

    const stateB = { ...state, nextWorkoutType: 'B' as const }
    const prescriptionB = getWorkoutPrescription(stateB)
    expect(prescriptionB.type).toBe('B')
    expect(prescriptionB.exercises.map(e => e.liftId)).toEqual(['squat', 'ohp', 'deadlift'])
  })

  test('importData rejects invalid input', () => {
    expect(importData('not json')).toEqual({ error: 'Invalid JSON' })
    expect(importData('"string"')).toEqual({ error: 'Invalid data format' })
    expect(importData('{}')).toEqual({ error: 'Missing required fields' })
    expect(importData('{"version":1,"units":"kg","lifts":{},"workouts":[]}')).toEqual({
      error: 'Missing lift data for squat',
    })
  })

  test('Status reflects stall after 2 failures', () => {
    let state = createTestState({ squat: 80 })

    // First failure
    let workout = makeWorkout(state, [
      makeFailedExercise('squat', 80, 4, 2),
      makeSuccessfulExercise('bench', 20),
      makeSuccessfulExercise('row', 30),
    ], 0)
    state = processWorkoutResult(state, workout)
    expect(state.lifts.squat.status).toBe('failed')
    expect(state.lifts.squat.failureCount).toBe(1)

    // Second failure
    workout = makeWorkout(state, [
      makeFailedExercise('squat', 80, 4, 2),
      makeSuccessfulExercise('bench', state.lifts.bench.currentWeight),
      makeSuccessfulExercise('row', state.lifts.row.currentWeight),
    ], 1)
    state = processWorkoutResult(state, workout)
    expect(state.lifts.squat.status).toBe('stalled')
    expect(state.lifts.squat.failureCount).toBe(2)
  })
})
