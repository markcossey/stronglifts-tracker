import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { DEFAULT_TAP_FEEDBACK } from '../model/defaults'
import { getFunctionalSession } from '../model/functionalSessions'
import { clearFunctionalDraft } from '../model/functionalDraft'
import FunctionalWorkoutEntry from './FunctionalWorkoutEntry'

beforeEach(() => {
  clearFunctionalDraft()
})

afterEach(() => {
  clearFunctionalDraft()
})

describe('FunctionalWorkoutEntry', () => {
  const session = getFunctionalSession('fm1')!

  test('Finish is disabled until every required exercise has its sets logged', () => {
    render(
      <FunctionalWorkoutEntry
        session={session}
        draft={null}
        tapFeedback={{ ...DEFAULT_TAP_FEEDBACK, haptics: false }}
        onOpenExercise={() => {}}
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: 'Finish Session' })).toBeDisabled()
  })

  test('cooldown exercises with "choose two" stay optional in fm2', () => {
    const fm2 = getFunctionalSession('fm2')!
    const onComplete = vi.fn()
    render(
      <FunctionalWorkoutEntry
        session={fm2}
        draft={null}
        tapFeedback={{ ...DEFAULT_TAP_FEEDBACK, haptics: false }}
        onOpenExercise={() => {}}
        onComplete={onComplete}
        onCancel={() => {}}
      />,
    )

    for (const exercise of fm2.exercises.filter(e => !e.optional)) {
      for (let i = 1; i <= exercise.sets; i++) {
        fireEvent.click(screen.getByRole('button', { name: `Mark ${exercise.name} set ${i} done` }))
      }
    }

    const finish = screen.getByRole('button', { name: 'Finish Session' })
    expect(finish).not.toBeDisabled()

    fireEvent.click(finish)

    expect(onComplete).toHaveBeenCalledTimes(1)
    const workout = onComplete.mock.calls[0][0]
    expect(workout.sessionId).toBe('fm2')
    expect(workout.category).toBe('Functional / Maintenance')

    const childsPose = workout.exercises.find((e: { exerciseId: string }) => e.exerciseId === 'childs-pose')
    expect(childsPose.sets.every((s: { completed: boolean }) => !s.completed)).toBe(true)
  })

  test('resumes from a saved draft', () => {
    const draft = {
      sessionId: 'fm1' as const,
      startTime: new Date().toISOString(),
      sets: session.exercises.map(ex => Array.from({ length: ex.sets }, () => null)),
      notes: session.exercises.map(() => ''),
      workoutNotes: 'resumed session',
    }

    render(
      <FunctionalWorkoutEntry
        session={session}
        draft={draft}
        tapFeedback={{ ...DEFAULT_TAP_FEEDBACK, haptics: false }}
        onOpenExercise={() => {}}
        onComplete={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.getByDisplayValue('resumed session')).toBeTruthy()
  })
})
