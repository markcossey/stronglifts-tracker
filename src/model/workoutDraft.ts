import type { PrescribedWorkout, SetResult } from './types'

const DRAFT_KEY = 'stronglifts-workout-draft'

export interface WorkoutDraft {
  prescription: PrescribedWorkout
  startTime: string
  sets: (SetResult | null)[][]
  notes: string[]
  workoutNotes: string
  weights: number[]
  restEndTime: number | null
  restDuration?: number
}

export function loadDraft(): WorkoutDraft | null {
  try {
    const stored = localStorage.getItem(DRAFT_KEY)
    return stored ? (JSON.parse(stored) as WorkoutDraft) : null
  } catch {
    return null
  }
}

export function saveDraft(draft: WorkoutDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
