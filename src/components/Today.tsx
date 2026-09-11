import { useState } from 'react'
import type { AppState, PrescribedWorkout, Workout, WorkoutType } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'
import { getWorkoutPrescription } from '../model/programme'
import { loadDraft } from '../model/workoutDraft'
import Button from '../ui/Button'
import Dashboard from './Dashboard'
import WorkoutEntry from './WorkoutEntry'
import WorkoutSummary from './WorkoutSummary'

interface TodayProps {
  state: AppState
  prescription: PrescribedWorkout
  onCompleteWorkout: (workout: Workout) => void
}

type ViewState =
  | { mode: 'overview' }
  | { mode: 'workout' }
  | { mode: 'summary'; workout: Workout }

function getPrescriptionForType(state: AppState, type: WorkoutType): PrescribedWorkout {
  const overridden = { ...state, nextWorkoutType: type }
  return getWorkoutPrescription(overridden)
}

export default function Today({ state, prescription, onCompleteWorkout }: TodayProps) {
  const [draft, setDraft] = useState(loadDraft)
  const [view, setView] = useState<ViewState>(draft ? { mode: 'workout' } : { mode: 'overview' })
  const [typeOverride, setTypeOverride] = useState<WorkoutType | null>(null)

  const recommendedType = state.nextWorkoutType
  const activeType = typeOverride ?? recommendedType
  const activePrescription = typeOverride
    ? getPrescriptionForType(state, typeOverride)
    : prescription

  function handleWorkoutComplete(workout: Workout) {
    onCompleteWorkout(workout)
    setDraft(null)
    setTypeOverride(null)
    setView({ mode: 'summary', workout })
  }

  if (view.mode === 'workout') {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <WorkoutEntry
          prescription={activePrescription}
          draft={draft}
          units={state.units}
          increments={state.increments}
          workouts={state.workouts}
          onComplete={handleWorkoutComplete}
          onCancel={() => {
            setDraft(null)
            setView({ mode: 'overview' })
          }}
        />
      </div>
    )
  }

  if (view.mode === 'summary') {
    const newPrescription = getWorkoutPrescription(state)
    return (
      <div className="p-4 max-w-lg mx-auto">
        <WorkoutSummary
          workout={view.workout}
          state={state}
          nextPrescription={newPrescription}
          onDone={() => setView({ mode: 'overview' })}
        />
      </div>
    )
  }

  const lastWorkout = state.workouts[state.workouts.length - 1]
  const today = new Date().toISOString().split('T')[0]
  const didWorkoutToday = lastWorkout?.date === today

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">
          What do I lift today?
        </h1>
        {didWorkoutToday && (
          <p className="text-sm text-green-400 mt-1">You already trained today</p>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-100">Workout</h2>
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              {(['A', 'B'] as WorkoutType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeOverride(t === recommendedType ? null : t)}
                  className={`px-3 py-1 rounded-md text-sm font-bold transition-colors ${
                    activeType === t
                      ? 'bg-[#3da836] text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <span className="text-sm text-gray-500 font-medium">
            {activePrescription.exercises.length} exercises
          </span>
        </div>

        {typeOverride && (
          <p className="text-xs text-amber-400">
            Overridden — the app recommends Workout {recommendedType}
          </p>
        )}

        <div className="space-y-3">
          {activePrescription.exercises.map(ex => (
            <div key={ex.liftId} className="flex items-center justify-between py-1">
              <span className="font-medium text-gray-300">{LIFT_DISPLAY_NAMES[ex.liftId]}</span>
              <span className="font-mono text-gray-100">
                {ex.weight} {state.units} × {ex.reps}
                {ex.sets > 1 ? ` (${ex.repScheme})` : ''}
              </span>
            </div>
          ))}
        </div>

        <Button fullWidth size="lg" onClick={() => setView({ mode: 'workout' })}>
          Start Workout
        </Button>
      </div>

      <Dashboard state={state} />
    </div>
  )
}
