export type Units = 'kg' | 'lb'
export type BodyWeightUnits = Units | 'st'
export type WorkoutType = 'A' | 'B'
export type LiftId = 'squat' | 'bench' | 'row' | 'ohp' | 'deadlift'
export type LiftStatus = 'progressing' | 'failed' | 'stalled' | 'deloading'
export type RepScheme = '5x5' | '3x5' | '3x3' | '1x5'

export interface LiftState {
  currentWeight: number
  failureCount: number
  deloadCount: number
  status: LiftStatus
  repScheme: RepScheme
}

export interface SetResult {
  reps: number
  targetReps: number
  completed: boolean
}

export interface ExerciseResult {
  liftId: LiftId
  prescribedWeight: number
  sets: SetResult[]
  notes?: string
}

export interface Workout {
  id: string
  date: string
  type: WorkoutType
  exercises: ExerciseResult[]
  notes?: string
  durationMinutes?: number
  startTime?: string
  endTime?: string
}

export interface SavedReview {
  month: string
  markdown: string
  savedAt: string
}

export interface BodyWeightEntry {
  date: string
  weight: number
}

export interface TapFeedback {
  sound: boolean
  haptics: boolean
}

export interface WorkoutUndo {
  workoutId: string
  lifts: Record<LiftId, LiftState>
  nextWorkoutType: WorkoutType
}

export interface AppState {
  version: number
  units: Units
  setupComplete: boolean
  nextWorkoutType: WorkoutType
  lifts: Record<LiftId, LiftState>
  increments: Record<LiftId, number>
  workouts: Workout[]
  lastWorkoutUndo?: WorkoutUndo
  tapFeedback?: TapFeedback
  bodyWeights?: BodyWeightEntry[]
  bodyWeightUnits?: BodyWeightUnits
  reviews?: SavedReview[]
}

export interface PrescribedExercise {
  liftId: LiftId
  weight: number
  sets: number
  reps: number
  repScheme: RepScheme
}

export interface PrescribedWorkout {
  type: WorkoutType
  exercises: PrescribedExercise[]
}
