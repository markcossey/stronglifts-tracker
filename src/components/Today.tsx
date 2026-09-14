import { useState } from 'react'
import type { AppState, BodyWeightEntry, BodyWeightUnits, FunctionalSessionId, FunctionalWorkout, LiftId, PrescribedWorkout, Workout, WorkoutType } from '../model/types'
import { DEFAULT_TAP_FEEDBACK, LIFT_DISPLAY_NAMES } from '../model/defaults'
import { getWorkoutPrescription } from '../model/programme'
import { loadDraft } from '../model/workoutDraft'
import { loadFunctionalDraft } from '../model/functionalDraft'
import { FUNCTIONAL_SESSIONS, getFunctionalSession } from '../model/functionalSessions'
import { localDateString } from '../model/dates'
import Button from '../ui/Button'
import BodyWeightCard from './BodyWeightCard'
import Dashboard from './Dashboard'
import WorkoutEntry from './WorkoutEntry'
import WorkoutSummary from './WorkoutSummary'
import FunctionalWorkoutEntry from './FunctionalWorkoutEntry'
import FunctionalWorkoutSummary from './FunctionalWorkoutSummary'

interface TodayProps {
  state: AppState
  prescription: PrescribedWorkout
  onCompleteWorkout: (workout: Workout) => void
  onCompleteFunctionalWorkout: (workout: FunctionalWorkout) => void
  onOpenFunctionalExercise: (sessionId: string, exerciseId: string) => void
  onOpenLift: (liftId: LiftId) => void
  onOpenBodyWeight: () => void
  onSaveBodyWeight: (entry: BodyWeightEntry, previousDate: string | undefined, bodyWeightUnits: BodyWeightUnits) => void
}

type ViewState =
  | { mode: 'overview' }
  | { mode: 'workout' }
  | { mode: 'summary'; workout: Workout }
  | { mode: 'functional'; sessionId: FunctionalSessionId }
  | { mode: 'functionalSummary'; workout: FunctionalWorkout }

function getPrescriptionForType(state: AppState, type: WorkoutType): PrescribedWorkout {
  const overridden = { ...state, nextWorkoutType: type }
  return getWorkoutPrescription(overridden)
}

export default function Today({
  state,
  prescription,
  onCompleteWorkout,
  onCompleteFunctionalWorkout,
  onOpenFunctionalExercise,
  onOpenLift,
  onOpenBodyWeight,
  onSaveBodyWeight,
}: TodayProps) {
  const [draft, setDraft] = useState(loadDraft)
  const [functionalDraft, setFunctionalDraft] = useState(loadFunctionalDraft)
  const [view, setView] = useState<ViewState>(
    draft
      ? { mode: 'workout' }
      : functionalDraft
        ? { mode: 'functional', sessionId: functionalDraft.sessionId }
        : { mode: 'overview' },
  )
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

  function handleFunctionalComplete(workout: FunctionalWorkout) {
    onCompleteFunctionalWorkout(workout)
    setFunctionalDraft(null)
    setView({ mode: 'functionalSummary', workout })
  }

  if (view.mode === 'functional') {
    const session = getFunctionalSession(view.sessionId)!
    return (
      <div className="p-4 max-w-lg mx-auto">
        <FunctionalWorkoutEntry
          session={session}
          draft={functionalDraft}
          tapFeedback={state.tapFeedback ?? DEFAULT_TAP_FEEDBACK}
          onOpenExercise={onOpenFunctionalExercise}
          onComplete={handleFunctionalComplete}
          onCancel={() => {
            setFunctionalDraft(null)
            setView({ mode: 'overview' })
          }}
        />
      </div>
    )
  }

  if (view.mode === 'functionalSummary') {
    const session = getFunctionalSession(view.workout.sessionId)!
    return (
      <div className="p-4 max-w-lg mx-auto">
        <FunctionalWorkoutSummary
          workout={view.workout}
          session={session}
          onDone={() => setView({ mode: 'overview' })}
        />
      </div>
    )
  }

  if (view.mode === 'workout') {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <WorkoutEntry
          prescription={activePrescription}
          draft={draft}
          units={state.units}
          increments={state.increments}
          tapFeedback={state.tapFeedback ?? DEFAULT_TAP_FEEDBACK}
          onOpenLift={onOpenLift}
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
  const today = localDateString()
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

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-100">Functional / Maintenance</h2>
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wide">Complementary</span>
        </div>
        <p className="text-sm text-gray-400">
          Low-intensity mobility &amp; stability work to alternate with StrongLifts — not a progression session. 25-30 min · RPE 5-6.
        </p>
        <div className="space-y-2">
          {FUNCTIONAL_SESSIONS.map(session => (
            <button
              key={session.id}
              type="button"
              onClick={() => setView({ mode: 'functional', sessionId: session.id })}
              className="w-full text-left bg-gray-800 hover:bg-gray-700 active:bg-gray-600 rounded-lg p-3 transition-colors"
            >
              <div className="font-semibold text-gray-100">{session.name}</div>
              <div className="text-xs text-gray-400">{session.focus}</div>
            </button>
          ))}
        </div>
      </div>

      <Dashboard state={state} onOpenLift={onOpenLift} />

      <BodyWeightCard state={state} onOpen={onOpenBodyWeight} onSave={onSaveBodyWeight} />
    </div>
  )
}
