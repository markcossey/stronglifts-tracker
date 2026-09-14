import { useState } from 'react'
import type { AppState, FunctionalWorkout, Workout } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'
import { canUndoWorkout, isExerciseComplete } from '../model/programme'
import { isFunctionalExerciseComplete, isFunctionalWorkoutComplete } from '../model/functional'
import { getFunctionalSession } from '../model/functionalSessions'
import { localDateString } from '../model/dates'
import WorkoutCalendar from './WorkoutCalendar'
import WorkoutDetail from './WorkoutDetail'
import FunctionalWorkoutDetail from './FunctionalWorkoutDetail'

interface HistoryProps {
  state: AppState
  onEditWorkout: (id: string, workout: Workout) => void
  onDeleteWorkout: (id: string) => void
  onEditFunctionalWorkout: (id: string, workout: FunctionalWorkout) => void
  onDeleteFunctionalWorkout: (id: string) => void
}

type HistoryEntry =
  | { kind: 'stronglifts'; workout: Workout }
  | { kind: 'functional'; workout: FunctionalWorkout }

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === localDateString()) return 'Today'
  if (dateStr === localDateString(yesterday)) return 'Yesterday'

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function History({
  state,
  onEditWorkout,
  onDeleteWorkout,
  onEditFunctionalWorkout,
  onDeleteFunctionalWorkout,
}: HistoryProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)

  if (selectedWorkout) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <WorkoutDetail
          workout={selectedWorkout}
          units={state.units}
          undoesProgress={canUndoWorkout(state, selectedWorkout.id)}
          onBack={() => setSelectedWorkout(null)}
          onSave={(updated) => {
            onEditWorkout(selectedWorkout.id, updated)
            setSelectedWorkout(updated)
          }}
          onDelete={() => {
            onDeleteWorkout(selectedWorkout.id)
            setSelectedWorkout(null)
          }}
        />
      </div>
    )
  }

  if (selectedEntry?.kind === 'functional') {
    const workout = selectedEntry.workout
    return (
      <div className="p-4 max-w-lg mx-auto">
        <FunctionalWorkoutDetail
          workout={workout}
          onBack={() => setSelectedEntry(null)}
          onSave={(updated) => {
            onEditFunctionalWorkout(workout.id, updated)
            setSelectedEntry({ kind: 'functional', workout: updated })
          }}
          onDelete={() => {
            onDeleteFunctionalWorkout(workout.id)
            setSelectedEntry(null)
          }}
        />
      </div>
    )
  }

  const entries: HistoryEntry[] = [
    ...state.workouts.map(workout => ({ kind: 'stronglifts' as const, workout })),
    ...(state.functionalWorkouts ?? []).map(workout => ({ kind: 'functional' as const, workout })),
  ].sort((a, b) => {
    if (a.workout.date !== b.workout.date) return b.workout.date.localeCompare(a.workout.date)
    return (b.workout.startTime ?? '').localeCompare(a.workout.startTime ?? '')
  })

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-100">History</h1>

      <WorkoutCalendar workouts={state.workouts} onSelectWorkout={setSelectedWorkout} />

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">&#x1F4DD;</div>
          <p>No workouts yet.</p>
          <p className="text-sm">Complete your first workout to see it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            if (entry.kind === 'stronglifts') {
              const workout = entry.workout
              const allComplete = workout.exercises.every(isExerciseComplete)
              return (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => setSelectedWorkout(workout)}
                  className="w-full text-left bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-100">
                        Workout {workout.type}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${allComplete ? 'bg-green-500' : 'bg-amber-500'}`} />
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(workout.date)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                    {workout.exercises.map(ex => (
                      <span key={ex.liftId} className="flex items-center gap-1">
                        <span className={isExerciseComplete(ex) ? 'text-green-400' : 'text-amber-400'}>
                          {isExerciseComplete(ex) ? '✓' : '✗'}
                        </span>
                        {LIFT_DISPLAY_NAMES[ex.liftId]} {ex.prescribedWeight}{state.units}
                      </span>
                    ))}
                  </div>
                  {workout.durationMinutes != null && (
                    <div className="text-xs text-gray-500 mt-1">{workout.durationMinutes} min</div>
                  )}
                </button>
              )
            }

            const workout = entry.workout
            const session = getFunctionalSession(workout.sessionId)
            const allComplete = isFunctionalWorkoutComplete(workout)
            return (
              <button
                key={workout.id}
                type="button"
                onClick={() => setSelectedEntry(entry)}
                className="w-full text-left bg-gray-900 rounded-xl border border-sky-900/60 p-4 hover:border-sky-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sky-400">
                      {session?.name ?? 'Functional / Maintenance'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${allComplete ? 'bg-sky-400' : 'bg-gray-600'}`} />
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(workout.date)}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                  {workout.exercises.map(ex => {
                    const def = session?.exercises.find(e => e.id === ex.exerciseId)
                    const complete = isFunctionalExerciseComplete(ex)
                    return (
                      <span key={ex.exerciseId} className="flex items-center gap-1">
                        <span className={complete ? 'text-sky-400' : 'text-gray-600'}>
                          {complete ? '✓' : '✗'}
                        </span>
                        {def?.name ?? ex.exerciseId}
                      </span>
                    )
                  })}
                </div>
                {workout.durationMinutes != null && (
                  <div className="text-xs text-gray-500 mt-1">{workout.durationMinutes} min</div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
