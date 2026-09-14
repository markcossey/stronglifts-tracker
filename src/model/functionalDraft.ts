import type { FunctionalSessionId } from './types'

const DRAFT_KEY = 'stronglifts-functional-draft'

export interface FunctionalWorkoutDraft {
  sessionId: FunctionalSessionId
  startTime: string
  sets: (boolean | null)[][]
  notes: string[]
  workoutNotes: string
}

export function loadFunctionalDraft(): FunctionalWorkoutDraft | null {
  try {
    const stored = localStorage.getItem(DRAFT_KEY)
    return stored ? (JSON.parse(stored) as FunctionalWorkoutDraft) : null
  } catch {
    return null
  }
}

export function saveFunctionalDraft(draft: FunctionalWorkoutDraft) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function clearFunctionalDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
