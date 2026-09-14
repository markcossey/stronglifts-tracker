import { useState } from 'react'
import type { FunctionalWorkout } from '../model/types'
import { getFunctionalSession } from '../model/functionalSessions'
import { isFunctionalExerciseComplete } from '../model/functional'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

interface FunctionalWorkoutDetailProps {
  workout: FunctionalWorkout
  onBack: () => void
  onSave: (updated: FunctionalWorkout) => void
  onDelete: () => void
}

export default function FunctionalWorkoutDetail({ workout, onBack, onSave, onDelete }: FunctionalWorkoutDetailProps) {
  const session = getFunctionalSession(workout.sessionId)
  const [editing, setEditing] = useState(false)
  const [editNotes, setEditNotes] = useState(workout.notes ?? '')
  const [exerciseNotes, setExerciseNotes] = useState<(string | undefined)[]>(
    workout.exercises.map(e => e.notes),
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleSave() {
    const updated: FunctionalWorkout = {
      ...workout,
      notes: editNotes || undefined,
      exercises: workout.exercises.map((e, i) => ({ ...e, notes: exerciseNotes[i] })),
    }
    onSave(updated)
    setEditing(false)
  }

  const date = new Date(workout.date + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-gray-200 p-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-100">{session?.name ?? workout.sessionId}</h2>
          <p className="text-sm text-gray-400">{date}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-sky-400 uppercase tracking-wide">{workout.category}</span>
        {workout.durationMinutes != null && (
          <span className="text-gray-500">· {workout.durationMinutes} minutes</span>
        )}
      </div>

      <div className="space-y-3">
        {workout.exercises.map((ex, exIdx) => {
          const def = session?.exercises.find(e => e.id === ex.exerciseId)
          const completed = isFunctionalExerciseComplete(ex)
          const completedSets = ex.sets.filter(s => s.completed).length

          return (
            <div key={ex.exerciseId} className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-100">{def?.name ?? ex.exerciseId}</h3>
                <span className={`text-sm font-medium ${completed ? 'text-sky-400' : 'text-gray-500'}`}>
                  {completedSets}/{ex.sets.length} sets
                </span>
              </div>
              {def && <div className="text-sm text-gray-400">{def.prescription}</div>}
              {def && def.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {def.equipment.map(item => (
                    <span key={item} className="text-[11px] font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {ex.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      set.completed ? 'bg-sky-900/50 text-sky-400' : 'bg-gray-800 text-gray-600'
                    }`}
                  >
                    {set.completed ? '✓' : '–'}
                  </div>
                ))}
              </div>
              {editing ? (
                <input
                  type="text"
                  placeholder="Note..."
                  value={exerciseNotes[exIdx] ?? ''}
                  onChange={e => {
                    const val = e.target.value
                    setExerciseNotes(prev => {
                      const next = [...prev]
                      next[exIdx] = val || undefined
                      return next
                    })
                  }}
                  className="w-full text-sm px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:border-sky-400 outline-none"
                />
              ) : ex.notes ? (
                <p className="text-sm text-gray-400 italic">{ex.notes}</p>
              ) : null}
            </div>
          )
        })}
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Session notes..."
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:border-sky-400 outline-none"
          />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button fullWidth className="!bg-sky-500 hover:!bg-sky-400 active:!bg-sky-600" onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {workout.notes && (
            <p className="text-sm text-gray-400 italic px-1">{workout.notes}</p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete session?"
          confirmLabel="Delete"
          destructive
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        >
          <p>This cannot be undone.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
