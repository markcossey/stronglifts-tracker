import { useState } from 'react'
import type { Workout } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'
import { isExerciseComplete } from '../model/programme'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

interface WorkoutDetailProps {
  workout: Workout
  units: string
  onBack: () => void
  onSave: (updated: Workout) => void
  onDelete: () => void
  undoesProgress: boolean
}

export default function WorkoutDetail({ workout, units, onBack, onSave, onDelete, undoesProgress }: WorkoutDetailProps) {
  const [editing, setEditing] = useState(false)
  const [editNotes, setEditNotes] = useState(workout.notes ?? '')
  const [exerciseNotes, setExerciseNotes] = useState<(string | undefined)[]>(
    workout.exercises.map(e => e.notes),
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function handleSave() {
    const updated: Workout = {
      ...workout,
      notes: editNotes || undefined,
      exercises: workout.exercises.map((e, i) => ({
        ...e,
        notes: exerciseNotes[i],
      })),
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
          <h2 className="text-lg font-bold text-gray-100">Workout {workout.type}</h2>
          <p className="text-sm text-gray-400">{date}</p>
        </div>
      </div>

      {workout.durationMinutes != null && (
        <div className="text-sm text-gray-400">Duration: {workout.durationMinutes} minutes</div>
      )}

      <div className="space-y-3">
        {workout.exercises.map((ex, exIdx) => {
          const completed = isExerciseComplete(ex)
          const completedSets = ex.sets.filter(s => s.completed).length

          return (
            <div key={ex.liftId} className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-100">{LIFT_DISPLAY_NAMES[ex.liftId]}</h3>
                <span className={`text-sm font-medium ${completed ? 'text-green-400' : 'text-amber-400'}`}>
                  {completed ? 'Completed' : `${completedSets}/${ex.sets.length} sets`}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {ex.prescribedWeight} {units}
              </div>
              <div className="flex gap-2">
                {ex.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      set.completed
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {set.reps}
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
                  className="w-full text-sm px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:border-[#47c23f] outline-none"
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
            placeholder="Workout notes..."
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-600 focus:border-[#47c23f] outline-none"
          />
          <p className="text-xs text-gray-500">
            Editing updates the record only. Your current weights are not affected.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button fullWidth onClick={handleSave}>Save Changes</Button>
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
          title="Delete workout?"
          confirmLabel="Delete"
          destructive
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        >
          <p>
            {undoesProgress
              ? 'This is your most recent workout, so your working weights and next workout will go back to what they were before it.'
              : 'This cannot be undone. Your current weights will not change.'}
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}
