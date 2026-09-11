import { useState } from 'react'
import type { AppState, Workout } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'
import { isExerciseComplete } from '../model/programme'
import WorkoutDetail from './WorkoutDetail'

interface HistoryProps {
  state: AppState
  onEditWorkout: (id: string, workout: Workout) => void
  onDeleteWorkout: (id: string) => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) return 'Today'
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function History({ state, onEditWorkout, onDeleteWorkout }: HistoryProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)

  if (selectedWorkout) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <WorkoutDetail
          workout={selectedWorkout}
          units={state.units}
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

  const sortedWorkouts = [...state.workouts].reverse()

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-100">History</h1>

      {sortedWorkouts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">&#x1F4DD;</div>
          <p>No workouts yet.</p>
          <p className="text-sm">Complete your first workout to see it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedWorkouts.map(workout => {
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
          })}
        </div>
      )}
    </div>
  )
}
