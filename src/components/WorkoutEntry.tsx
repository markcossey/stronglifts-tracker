import { useState, useEffect, useRef } from 'react'
import type { ExerciseResult, LiftId, PrescribedWorkout, SetResult, TapFeedback, Workout, Units } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'
import { localDateString } from '../model/dates'
import { clearDraft, saveDraft, type WorkoutDraft } from '../model/workoutDraft'
import SetButton from '../ui/SetButton'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import PlateDisplay from '../ui/PlateDisplay'
import Sparkline from '../ui/Sparkline'
import { playRestAlert, playTapSound, unlockAudio, vibrateTap } from '../ui/feedback'
import { getRestDuration, REST_AFTER_SET } from '../model/rest'

interface WorkoutEntryProps {
  prescription: PrescribedWorkout
  draft: WorkoutDraft | null
  units: string
  increments: Record<LiftId, number>
  tapFeedback: TapFeedback
  onOpenLift: (liftId: LiftId) => void
  workouts: Workout[]
  onComplete: (workout: Workout) => void
  onCancel: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function WorkoutEntry({ prescription: initialPrescription, draft, units, increments, tapFeedback, onOpenLift, workouts, onComplete, onCancel }: WorkoutEntryProps) {
  const [prescription] = useState(() => draft?.prescription ?? initialPrescription)
  const [startTime] = useState(() => draft?.startTime ?? new Date().toISOString())
  const [now, setNow] = useState(() => Date.now())
  const [exercises, setExercises] = useState<(SetResult | null)[][]>(() =>
    draft?.sets ?? prescription.exercises.map(ex =>
      Array.from({ length: ex.sets }, () => null),
    ),
  )
  const [notes, setNotes] = useState<string[]>(
    () => draft?.notes ?? prescription.exercises.map(() => ''),
  )
  const [workoutNotes, setWorkoutNotes] = useState(draft?.workoutNotes ?? '')
  const [restEndTime, setRestEndTime] = useState<number | null>(draft?.restEndTime ?? null)
  const [restDuration, setRestDuration] = useState(draft?.restDuration ?? REST_AFTER_SET)
  const [showPlates, setShowPlates] = useState<LiftId | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [weightOverrides, setWeightOverrides] = useState<number[]>(
    () => draft?.weights ?? prescription.exercises.map(ex => ex.weight),
  )
  const alertedRestEnd = useRef<number | null>(null)

  useEffect(() => {
    saveDraft({
      prescription,
      startTime,
      sets: exercises,
      notes,
      workoutNotes,
      weights: weightOverrides,
      restEndTime,
      restDuration,
    })
  }, [prescription, startTime, exercises, notes, workoutNotes, weightOverrides, restEndTime, restDuration])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (restEndTime === null || now < restEndTime || alertedRestEnd.current === restEndTime) return
    alertedRestEnd.current = restEndTime
    // Stay quiet when resuming a workout whose rest ended long ago
    if (now - restEndTime < 5000) playRestAlert()
  }, [now, restEndTime])

  const elapsed = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000))
  const restRemaining = restEndTime === null ? null : Math.ceil((restEndTime - now) / 1000)
  const restOver = restRemaining !== null && restRemaining <= 0

  function adjustWeight(exIdx: number, direction: 1 | -1) {
    const liftId = prescription.exercises[exIdx].liftId
    const increment = increments[liftId]
    setWeightOverrides(prev => {
      const next = prev[exIdx] + direction * increment
      if (next < 0) return prev
      return prev.map((w, i) => (i === exIdx ? next : w))
    })
  }

  function handleCancel() {
    const hasProgress = exercises.some(ex => ex.some(s => s !== null))
      || notes.some(Boolean)
      || workoutNotes !== ''
    if (hasProgress) {
      setShowDiscardConfirm(true)
    } else {
      discardWorkout()
    }
  }

  function discardWorkout() {
    clearDraft()
    onCancel()
  }

  function updateSet(exerciseIdx: number, setIdx: number, result: SetResult | null) {
    const next = exercises.map(e => [...e])
    next[exerciseIdx][setIdx] = result
    setExercises(next)

    unlockAudio()
    if (tapFeedback.sound) playTapSound(result === null ? 'reset' : result.completed ? 'complete' : 'fail')
    if (tapFeedback.haptics) vibrateTap()

    if (result === null) return
    if (next.every(ex => ex.every(s => s !== null))) {
      setRestEndTime(null)
    } else {
      const duration = getRestDuration(result.completed)
      const start = Date.now()
      setNow(start)
      setRestDuration(duration)
      setRestEndTime(start + duration * 1000)
    }
  }

  function allSetsRecorded(): boolean {
    return exercises.every(ex => ex.every(s => s !== null))
  }

  function handleFinish() {
    const endTime = new Date().toISOString()
    const durationMinutes = Math.round(elapsed / 60)

    const exerciseResults: ExerciseResult[] = prescription.exercises.map((ex, i) => ({
      liftId: ex.liftId,
      prescribedWeight: weightOverrides[i],
      sets: exercises[i].map(s => s!),
      notes: notes[i] || undefined,
    }))

    const workout: Workout = {
      id: crypto.randomUUID(),
      date: localDateString(),
      type: prescription.type,
      exercises: exerciseResults,
      notes: workoutNotes || undefined,
      durationMinutes,
      startTime,
      endTime,
    }

    clearDraft()
    onComplete(workout)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={handleCancel} aria-label="Discard workout" className="text-gray-400 hover:text-gray-200 p-2 -ml-2">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="text-sm font-mono text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
          {formatTime(elapsed)}
        </div>
        <div className="text-sm font-medium text-gray-400">
          Workout {prescription.type}
        </div>
      </div>

      {prescription.exercises.map((ex, exIdx) => {
        const currentWeight = weightOverrides[exIdx]
        const isOverridden = currentWeight !== ex.weight

        return (
          <div key={ex.liftId} className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3>
                <button
                  type="button"
                  onClick={() => onOpenLift(ex.liftId)}
                  className="flex items-center gap-1 text-lg font-bold text-gray-100 hover:text-white active:text-[#47c23f] transition-colors"
                >
                  {LIFT_DISPLAY_NAMES[ex.liftId]}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </h3>
              <Sparkline liftId={ex.liftId} workouts={workouts} />
            </div>

            <div className="flex items-center justify-center gap-3 py-2 -my-1">
              <button
                type="button"
                onClick={() => adjustWeight(exIdx, -1)}
                className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-700 active:bg-gray-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14" strokeLinecap="round" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => setShowPlates(showPlates === ex.liftId ? null : ex.liftId)}
                className="group text-center min-w-[100px]"
              >
                <span className="text-3xl font-bold font-mono text-gray-50 group-active:text-[#47c23f] transition-colors">
                  {currentWeight}
                </span>
                <span className="text-lg text-gray-400 ml-1">{units}</span>
                {isOverridden && (
                  <div className="text-xs text-amber-400 mt-0.5">adjusted</div>
                )}
                {!isOverridden && (
                  <div className="text-xs text-gray-600 mt-0.5">tap for plates</div>
                )}
              </button>

              <button
                type="button"
                onClick={() => adjustWeight(exIdx, 1)}
                className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-700 active:bg-gray-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {showPlates === ex.liftId && (
              <PlateDisplay
                weight={currentWeight}
                units={units as Units}
                onClose={() => setShowPlates(null)}
              />
            )}

            <div className="relative flex gap-2 justify-center pt-3">
              {exercises[exIdx].map((setResult, setIdx) => (
                <SetButton
                  key={setIdx}
                  targetReps={ex.reps}
                  actualReps={setResult?.reps ?? null}
                  haptic={tapFeedback.haptics}
                  onComplete={() =>
                    updateSet(exIdx, setIdx, {
                      reps: ex.reps,
                      targetReps: ex.reps,
                      completed: true,
                    })
                  }
                  onFail={(reps) =>
                    updateSet(exIdx, setIdx, {
                      reps,
                      targetReps: ex.reps,
                      completed: false,
                    })
                  }
                  onReset={() => updateSet(exIdx, setIdx, null)}
                />
              ))}
            </div>

            <input
              type="text"
              placeholder="Add a note..."
              value={notes[exIdx]}
              onChange={e => {
                const val = e.target.value
                setNotes(prev => prev.map((n, i) => (i === exIdx ? val : n)))
              }}
              className="w-full text-sm px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:border-[#47c23f] focus:ring-1 focus:ring-[#47c23f] outline-none"
            />
          </div>
        )
      })}

      <input
        type="text"
        placeholder="Workout notes..."
        value={workoutNotes}
        onChange={e => setWorkoutNotes(e.target.value)}
        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-600 focus:border-[#47c23f] focus:ring-1 focus:ring-[#47c23f] outline-none"
      />

      <Button
        fullWidth
        size="lg"
        disabled={!allSetsRecorded()}
        onClick={handleFinish}
      >
        Finish Workout
      </Button>

      {restRemaining !== null && (
        <>
          {/* Lets the Finish button scroll clear of the pinned rest bar */}
          <div className="h-20" aria-hidden="true" />
          <div className="fixed inset-x-0 above-nav z-30 px-4 pb-2 pointer-events-none">
            <button
              type="button"
              aria-label="Dismiss rest timer"
              onClick={() => setRestEndTime(null)}
              className={`pointer-events-auto relative overflow-hidden max-w-lg mx-auto w-full flex items-center justify-between gap-3 bg-gray-900/95 backdrop-blur rounded-xl border px-4 py-2.5 shadow-lg shadow-black/50 ${
                restOver ? 'border-amber-400' : 'border-gray-700'
              }`}
            >
              <div className="text-left">
                <div className={`text-sm font-medium ${restOver ? 'text-amber-400' : 'text-gray-300'}`}>
                  {restOver ? 'Rest over — next set' : 'Rest'}
                </div>
                <div className="text-xs text-gray-600">tap to dismiss</div>
              </div>
              <div className={`text-2xl font-mono font-bold ${restOver ? 'text-amber-400' : 'text-[#47c23f]'}`}>
                {restOver ? `+${formatTime(Math.abs(restRemaining))}` : formatTime(restRemaining)}
              </div>
              {!restOver && (
                <div
                  className="absolute left-0 bottom-0 h-1 bg-[#47c23f] transition-all duration-1000"
                  style={{ width: `${(restRemaining / restDuration) * 100}%` }}
                />
              )}
            </button>
          </div>
        </>
      )}

      {showDiscardConfirm && (
        <ConfirmDialog
          title="Discard workout?"
          confirmLabel="Discard"
          cancelLabel="Keep going"
          destructive
          onConfirm={discardWorkout}
          onCancel={() => setShowDiscardConfirm(false)}
        >
          <p>The sets you've logged in this workout will be lost.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
