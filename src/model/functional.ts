import type { AppState, FunctionalExerciseResult, FunctionalWorkout } from './types'

export function isFunctionalExerciseComplete(exercise: FunctionalExerciseResult): boolean {
  return exercise.sets.length > 0 && exercise.sets.every(s => s.completed)
}

export function isFunctionalWorkoutComplete(workout: FunctionalWorkout): boolean {
  return workout.exercises.every(isFunctionalExerciseComplete)
}

// Functional/Maintenance sessions are appended to history only — they never touch
// state.lifts, state.increments or nextWorkoutType, so they can't be mistaken for
// StrongLifts progression and never affect it.
export function completeFunctionalWorkout(state: AppState, workout: FunctionalWorkout): AppState {
  return {
    ...state,
    functionalWorkouts: [...(state.functionalWorkouts ?? []), workout],
  }
}

export function updateFunctionalWorkoutInHistory(
  state: AppState,
  workoutId: string,
  updated: FunctionalWorkout,
): AppState {
  return {
    ...state,
    functionalWorkouts: (state.functionalWorkouts ?? []).map(w => (w.id === workoutId ? updated : w)),
  }
}

export function deleteFunctionalWorkoutFromHistory(state: AppState, workoutId: string): AppState {
  return {
    ...state,
    functionalWorkouts: (state.functionalWorkouts ?? []).filter(w => w.id !== workoutId),
  }
}
