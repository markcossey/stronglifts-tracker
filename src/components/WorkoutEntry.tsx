import { useState, useEffect, useCallback } from 'react'
import type { ExerciseResult, LiftId, PrescribedWorkout, SetResult, Workout, Units } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'
import SetButton from '../ui/SetButton'
import Button from '../ui/Button'
import PlateDisplay from '../ui/PlateDisplay'
import Sparkline from '../ui/Sparkline'

const REST_DURATION = 180

interface WorkoutEntryProps {
  prescription: PrescribedWorkout
  units: string
  increments: Record<LiftId, number>
  workouts: Workout[]
  onComplete: (workout: Workout) => void
  onCancel: () => void
}

export default function WorkoutEntry({ prescription, units, increments, workouts, onComplete, onCancel }: WorkoutEntryProps) {
  const [startTime] = useState(() => new Date().toISOString())
  const [elapsed, setElapsed] = useState(0)
  const [exercises, setExercises] = useState<(SetResult | null)[][]>(() =>
    prescription.exercises.map(ex =>
      Array.from({ length: ex.sets }, () => null),
    ),
  )
  const [notes, setNotes] = useState<(string | undefined)[]>(
    () => prescription.exercises.map(() => undefined),
  )
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [restEndTime, setRestEndTime] = useState<number | null>(null)
  const [restRemaining, setRestRemaining] = useState(0)
  const [showPlates, setShowPlates] = useState<LiftId | null>(null)
  const [weightOverrides, setWeightOverrides] = useState<Record<number, number>>(() => {
    const overrides: Record<number, number> = {}
    prescription.exercises.forEach((ex, i) => {
      overrides[i] = ex.weight
    })
    return overrides
  })

  const startRestTimer = useCallback(() => {
    setRestEndTime(Date.now() + REST_DURATION * 1000)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000))
      if (restEndTime !== null) {
        const remaining = Math.max(0, Math.ceil((restEndTime - Date.now()) / 1000))
        setRestRemaining(remaining)
        if (remaining === 0) setRestEndTime(null)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, restEndTime])

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function adjustWeight(exIdx: number, direction: 1 | -1) {
    const liftId = prescription.exercises[exIdx].liftId
    const increment = increments[liftId]
    setWeightOverrides(prev => {
      const current = prev[exIdx]
      const next = current + direction * increment
      if (next < 0) return prev
      return { ...prev, [exIdx]: next }
    })
  }

  function updateSet(exerciseIdx: number, setIdx: number, result: SetResult | null) {
    if (result !== null) {
      const totalSets = prescription.exercises[exerciseIdx].sets
      const isLastSet = setIdx === totalSets - 1
      if (isLastSet) {
        setRestEndTime(null)
      } else {
        startRestTimer()
      }
    }
    setExercises(prev => {
      const next = prev.map(e => [...e])
      next[exerciseIdx][setIdx] = result
      return next
    })
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
      notes: notes[i],
    }))

    const workout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      type: prescription.type,
      exercises: exerciseResults,
      notes: workoutNotes || undefined,
      durationMinutes,
      startTime,
      endTime,
    }

    onComplete(workout)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-200 p-2 -ml-2">
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

      {restEndTime !== null && (
        <button
          type="button"
          onClick={() => setRestEndTime(null)}
          className="w-full bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Rest Timer</span>
            <span className="text-xs text-gray-600">tap to dismiss</span>
          </div>
          <div className="text-3xl font-mono font-bold text-center text-[#47c23f]">
            {Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, '0')}
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-[#47c23f] h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${(restRemaining / REST_DURATION) * 100}%` }}
            />
          </div>
        </button>
      )}

      {prescription.exercises.map((ex, exIdx) => {
        const currentWeight = weightOverrides[exIdx]
        const isOverridden = currentWeight !== ex.weight

        return (
          <div key={ex.liftId} className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-100">{LIFT_DISPLAY_NAMES[ex.liftId]}</h3>
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

            <div className="flex gap-3 justify-center">
              {exercises[exIdx].map((setResult, setIdx) => (
                <SetButton
                  key={setIdx}
                  targetReps={ex.reps}
                  actualReps={setResult?.reps ?? null}
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
              value={notes[exIdx] ?? ''}
              onChange={e => {
                const val = e.target.value
                setNotes(prev => {
                  const next = [...prev]
                  next[exIdx] = val || undefined
                  return next
                })
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
    </div>
  )
}
