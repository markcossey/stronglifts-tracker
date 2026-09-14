import { describe, expect, test } from 'vitest'
import type { FunctionalExerciseResult, FunctionalWorkout } from './types'
import { createAppState } from './programme'
import { DEFAULT_STARTING_WEIGHTS_KG } from './defaults'
import {
  completeFunctionalWorkout,
  deleteFunctionalWorkoutFromHistory,
  isFunctionalExerciseComplete,
  isFunctionalWorkoutComplete,
  updateFunctionalWorkoutInHistory,
} from './functional'

function makeExercise(exerciseId: string, ...completed: boolean[]): FunctionalExerciseResult {
  return { exerciseId, sets: completed.map(c => ({ completed: c })) }
}

function makeWorkout(id: string, exercises: FunctionalExerciseResult[]): FunctionalWorkout {
  return {
    id,
    date: '2026-09-15',
    sessionId: 'fm1',
    category: 'Functional / Maintenance',
    exercises,
  }
}

describe('isFunctionalExerciseComplete / isFunctionalWorkoutComplete', () => {
  test('an exercise is complete when every set is completed', () => {
    expect(isFunctionalExerciseComplete(makeExercise('a', true, true))).toBe(true)
    expect(isFunctionalExerciseComplete(makeExercise('a', true, false))).toBe(false)
    expect(isFunctionalExerciseComplete(makeExercise('a'))).toBe(false)
  })

  test('a workout is complete only when every exercise is complete', () => {
    const complete = makeWorkout('w1', [makeExercise('a', true), makeExercise('b', true, true)])
    const partial = makeWorkout('w2', [makeExercise('a', true), makeExercise('b', true, false)])

    expect(isFunctionalWorkoutComplete(complete)).toBe(true)
    expect(isFunctionalWorkoutComplete(partial)).toBe(false)
  })
})

describe('completing a functional workout', () => {
  test('appends to functionalWorkouts without touching StrongLifts progression state', () => {
    const state = createAppState('kg', DEFAULT_STARTING_WEIGHTS_KG)
    const workout = makeWorkout('w1', [makeExercise('landmine-reverse-lunge', true, true, true)])

    const next = completeFunctionalWorkout(state, workout)

    expect(next.functionalWorkouts).toEqual([workout])
    // Every StrongLifts field is untouched — same reference, not just equal.
    expect(next.lifts).toBe(state.lifts)
    expect(next.increments).toBe(state.increments)
    expect(next.nextWorkoutType).toBe(state.nextWorkoutType)
    expect(next.workouts).toBe(state.workouts)
    expect(next.lastWorkoutUndo).toBeUndefined()
  })

  test('appends after any existing functional workouts', () => {
    const state = { ...createAppState('kg', DEFAULT_STARTING_WEIGHTS_KG), functionalWorkouts: [makeWorkout('w1', [])] }
    const next = completeFunctionalWorkout(state, makeWorkout('w2', []))

    expect(next.functionalWorkouts!.map(w => w.id)).toEqual(['w1', 'w2'])
  })
})

describe('editing and deleting functional workout history', () => {
  const base = { ...createAppState('kg', DEFAULT_STARTING_WEIGHTS_KG), functionalWorkouts: [makeWorkout('w1', [makeExercise('a', true)])] }

  test('updateFunctionalWorkoutInHistory replaces only the matching workout', () => {
    const updated = { ...base.functionalWorkouts![0], notes: 'felt good' }
    const next = updateFunctionalWorkoutInHistory(base, 'w1', updated)

    expect(next.functionalWorkouts![0].notes).toBe('felt good')
  })

  test('deleteFunctionalWorkoutFromHistory removes it and leaves StrongLifts workouts alone', () => {
    const next = deleteFunctionalWorkoutFromHistory(base, 'w1')

    expect(next.functionalWorkouts).toEqual([])
    expect(next.workouts).toBe(base.workouts)
  })
})
