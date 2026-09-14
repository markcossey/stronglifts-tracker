import type { FunctionalSession, FunctionalWorkout } from '../model/types'
import { isFunctionalExerciseComplete } from '../model/functional'
import Button from '../ui/Button'

interface FunctionalWorkoutSummaryProps {
  workout: FunctionalWorkout
  session: FunctionalSession
  onDone: () => void
}

export default function FunctionalWorkoutSummary({ workout, session, onDone }: FunctionalWorkoutSummaryProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl">&#x1F9D8;</div>
        <h2 className="text-2xl font-bold text-gray-100">Session Complete</h2>
        <p className="text-sm text-sky-400">{session.name}</p>
        {workout.durationMinutes != null && (
          <p className="text-gray-400">{workout.durationMinutes} minutes</p>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 divide-y divide-gray-800">
        {workout.exercises.map(ex => {
          const def = session.exercises.find(e => e.id === ex.exerciseId)
          const completed = isFunctionalExerciseComplete(ex)
          const completedSets = ex.sets.filter(s => s.completed).length
          const totalSets = ex.sets.length

          return (
            <div key={ex.exerciseId} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-100">{def?.name ?? ex.exerciseId}</div>
                <div className="text-sm text-gray-400">{completedSets}/{totalSets} sets</div>
              </div>
              {completed ? (
                <span className="text-sky-400">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              ) : (
                <span className="text-gray-600 text-sm">skipped</span>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-500 px-1">
        This session doesn't affect your StrongLifts weights or progression.
      </p>

      <Button fullWidth size="lg" className="!bg-sky-500 hover:!bg-sky-400 active:!bg-sky-600" onClick={onDone}>
        Done
      </Button>
    </div>
  )
}
