import { useEffect, useState } from 'react'
import type {
  FunctionalExerciseResult,
  FunctionalSession,
  FunctionalSectionId,
  FunctionalWorkout,
  TapFeedback,
} from '../model/types'
import { localDateString } from '../model/dates'
import {
  clearFunctionalDraft,
  saveFunctionalDraft,
  type FunctionalWorkoutDraft,
} from '../model/functionalDraft'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import TapTarget from '../ui/TapTarget'
import { playTapSound, unlockAudio, vibrateTap } from '../ui/feedback'

interface FunctionalWorkoutEntryProps {
  session: FunctionalSession
  draft: FunctionalWorkoutDraft | null
  tapFeedback: TapFeedback
  onComplete: (workout: FunctionalWorkout) => void
  onCancel: () => void
}

const SECTION_LABELS: Record<FunctionalSectionId, string> = {
  warmup: 'Warm-up / Mobility',
  main: 'Main work',
  cooldown: 'Cool-down / Mobility',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function FunctionalWorkoutEntry({
  session,
  draft,
  tapFeedback,
  onComplete,
  onCancel,
}: FunctionalWorkoutEntryProps) {
  const [startTime] = useState(() => draft?.startTime ?? new Date().toISOString())
  const [now, setNow] = useState(() => Date.now())
  const [sets, setSets] = useState<(boolean | null)[][]>(
    () => draft?.sets ?? session.exercises.map(ex => Array.from({ length: ex.sets }, () => null)),
  )
  const [notes, setNotes] = useState<string[]>(
    () => draft?.notes ?? session.exercises.map(() => ''),
  )
  const [workoutNotes, setWorkoutNotes] = useState(draft?.workoutNotes ?? '')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  useEffect(() => {
    saveFunctionalDraft({ sessionId: session.id, startTime, sets, notes, workoutNotes })
  }, [session.id, startTime, sets, notes, workoutNotes])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const elapsed = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000))

  function toggleSet(exIdx: number, setIdx: number) {
    const next = sets.map(e => [...e])
    next[exIdx][setIdx] = next[exIdx][setIdx] ? null : true
    setSets(next)

    unlockAudio()
    if (tapFeedback.sound) playTapSound(next[exIdx][setIdx] ? 'complete' : 'reset')
    if (tapFeedback.haptics) vibrateTap()
  }

  function handleCancel() {
    const hasProgress = sets.some(ex => ex.some(s => s !== null)) || notes.some(Boolean) || workoutNotes !== ''
    if (hasProgress) {
      setShowDiscardConfirm(true)
    } else {
      discardWorkout()
    }
  }

  function discardWorkout() {
    clearFunctionalDraft()
    onCancel()
  }

  function requiredSetsRecorded(): boolean {
    return session.exercises.every((ex, i) => ex.optional || sets[i].every(s => s !== null))
  }

  function handleFinish() {
    const endTime = new Date().toISOString()
    const durationMinutes = Math.round(elapsed / 60)

    const exerciseResults: FunctionalExerciseResult[] = session.exercises.map((ex, i) => ({
      exerciseId: ex.id,
      sets: sets[i].map(s => ({ completed: s === true })),
      notes: notes[i] || undefined,
    }))

    const workout: FunctionalWorkout = {
      id: crypto.randomUUID(),
      date: localDateString(),
      sessionId: session.id,
      category: session.category,
      exercises: exerciseResults,
      notes: workoutNotes || undefined,
      durationMinutes,
      startTime,
      endTime,
    }

    clearFunctionalDraft()
    onComplete(workout)
  }

  const sections: FunctionalSectionId[] = ['warmup', 'main', 'cooldown']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={handleCancel} aria-label="Discard session" className="text-gray-400 hover:text-gray-200 p-2 -ml-2">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="text-sm font-mono text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
          {formatTime(elapsed)}
        </div>
        <div className="text-sm font-medium text-sky-400">
          {session.name}
        </div>
      </div>

      <div className="bg-sky-950/40 border border-sky-900 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wide">{session.category}</span>
          <span className="text-xs text-gray-400">
            {session.targetDurationMinutes[0]}-{session.targetDurationMinutes[1]} min · RPE {session.targetRPE}
          </span>
        </div>
        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
          {session.programmingNotes.map(note => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      {sections.map(section => {
        const indices = session.exercises
          .map((ex, i) => [ex, i] as const)
          .filter(([ex]) => ex.section === section)

        if (indices.length === 0) return null

        return (
          <div key={section} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide px-1">
              {SECTION_LABELS[section]}
            </h3>

            {indices.map(([ex, exIdx]) => (
              <div key={ex.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
                <div>
                  <h4 className="text-lg font-bold text-gray-100">
                    {ex.name}
                    {ex.optional && <span className="text-xs font-normal text-gray-500"> (optional)</span>}
                  </h4>
                  <p className="text-sm text-gray-400">{ex.prescription}</p>
                  {ex.cue && <p className="text-xs text-gray-500 italic mt-0.5">{ex.cue}</p>}
                  {ex.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ex.equipment.map(item => (
                        <span key={item} className="text-[11px] font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-center pt-1">
                  {sets[exIdx].map((done, setIdx) => (
                    <TapTarget
                      key={setIdx}
                      haptic={tapFeedback.haptics}
                      onTap={() => toggleSet(exIdx, setIdx)}
                      label={done ? `${ex.name} set ${setIdx + 1} done. Tap to reset` : `Mark ${ex.name} set ${setIdx + 1} done`}
                      round="999px"
                      className="flex-1 max-w-16 aspect-square rounded-full"
                    >
                      <span
                        className={`w-full h-full rounded-full border-[2.5px] flex items-center justify-center text-xl font-bold select-none group-active:scale-95 transition-all ${
                          done
                            ? 'border-sky-400 bg-sky-400 text-gray-950'
                            : 'border-gray-300 bg-transparent text-gray-300'
                        }`}
                      >
                        {done ? (
                          <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          setIdx + 1
                        )}
                      </span>
                    </TapTarget>
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
                  className="w-full text-sm px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none"
                />
              </div>
            ))}
          </div>
        )
      })}

      <input
        type="text"
        placeholder="Session notes..."
        value={workoutNotes}
        onChange={e => setWorkoutNotes(e.target.value)}
        className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-600 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none"
      />

      <Button
        fullWidth
        size="lg"
        className="!bg-sky-500 hover:!bg-sky-400 active:!bg-sky-600"
        disabled={!requiredSetsRecorded()}
        onClick={handleFinish}
      >
        Finish Session
      </Button>

      {showDiscardConfirm && (
        <ConfirmDialog
          title="Discard session?"
          confirmLabel="Discard"
          cancelLabel="Keep going"
          destructive
          onConfirm={discardWorkout}
          onCancel={() => setShowDiscardConfirm(false)}
        >
          <p>The sets you've logged in this session will be lost.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
