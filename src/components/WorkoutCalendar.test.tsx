import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { SetResult, Workout, WorkoutType } from '../model/types'
import WorkoutCalendar from './WorkoutCalendar'

function sets(completed: boolean): SetResult[] {
  return [{ reps: completed ? 5 : 3, targetReps: 5, completed }]
}

function workout(date: string, type: WorkoutType, completed = true): Workout {
  return {
    id: date,
    date,
    type,
    exercises: [{ liftId: 'squat', prescribedWeight: 60, sets: sets(completed) }],
  }
}

// Sunday 13 September 2026
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 13))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WorkoutCalendar', () => {
  const workouts = [
    workout('2026-08-31', 'B'),
    workout('2026-09-07', 'A'),
    workout('2026-09-09', 'B', false),
    workout('2026-09-11', 'A'),
  ]

  test('summarises this week and the streak', () => {
    const { container } = render(<WorkoutCalendar workouts={workouts} onSelectWorkout={() => {}} />)

    expect(container.textContent).toContain('3 this week')
    expect(container.textContent).toContain('2 week streak')
  })

  test('says there is no streak yet when nothing is logged', () => {
    const { container } = render(<WorkoutCalendar workouts={[]} onSelectWorkout={() => {}} />)

    expect(container.textContent).toContain('0 this week')
    expect(container.textContent).toContain('no streak yet')
  })
})
