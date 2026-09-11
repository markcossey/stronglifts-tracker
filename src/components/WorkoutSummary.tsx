import type { AppState, PrescribedWorkout, Workout } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'
import { isExerciseComplete } from '../model/programme'
import Button from '../ui/Button'

interface WorkoutSummaryProps {
  workout: Workout
  state: AppState
  nextPrescription: PrescribedWorkout
  onDone: () => void
}

export default function WorkoutSummary({ workout, state, nextPrescription, onDone }: WorkoutSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl">&#x1F3CB;</div>
        <h2 className="text-2xl font-bold text-gray-100">Workout Complete</h2>
        {workout.durationMinutes != null && (
          <p className="text-gray-400">{workout.durationMinutes} minutes</p>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
        {workout.exercises.map(ex => {
          const completed = isExerciseComplete(ex)
          const completedSets = ex.sets.filter(s => s.completed).length
          const totalSets = ex.sets.length
          const liftState = state.lifts[ex.liftId]

          return (
            <div key={ex.liftId} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-100">{LIFT_DISPLAY_NAMES[ex.liftId]}</div>
                <div className="text-sm text-gray-400">
                  {ex.prescribedWeight} {state.units} — {completedSets}/{totalSets} sets
                </div>
              </div>
              <div className="flex items-center gap-2">
                {completed ? (
                  <span className="text-green-400 font-medium text-sm flex items-center gap-1">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Weight up!
                  </span>
                ) : liftState.status === 'deloading' ? (
                  <span className="text-[#47c23f] font-medium text-sm">Deload</span>
                ) : (
                  <span className="text-amber-400 font-medium text-sm">Try again</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Next Workout</h3>
        <div className="text-lg font-bold text-gray-100">Workout {nextPrescription.type}</div>
        {nextPrescription.exercises.map(ex => (
          <div key={ex.liftId} className="flex justify-between text-sm">
            <span className="text-gray-400">{LIFT_DISPLAY_NAMES[ex.liftId]}</span>
            <span className="font-mono font-medium text-gray-100">
              {ex.weight} {state.units} × {ex.reps}
              {ex.sets > 1 && ` (${ex.sets} sets)`}
            </span>
          </div>
        ))}
      </div>

      <Button fullWidth size="lg" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}
