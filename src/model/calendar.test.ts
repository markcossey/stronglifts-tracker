import { describe, expect, test } from 'vitest'
import type { Workout } from './types'
import { getMonthGrid, getTrainingStats, getWeekStart, getWorkoutsByDate } from './calendar'

function workout(date: string, id = date): Workout {
  return { id, date, type: 'A', exercises: [] }
}

describe('month grid', () => {
  test('starts weeks on Monday and pads with neighbouring days', () => {
    // 1 September 2026 is a Tuesday, 30 September a Wednesday
    const weeks = getMonthGrid(2026, 8)

    expect(weeks).toHaveLength(5)
    expect(weeks[0][0]).toEqual({ date: '2026-08-31', inMonth: false })
    expect(weeks[0][1]).toEqual({ date: '2026-09-01', inMonth: true })
    expect(weeks[4][2]).toEqual({ date: '2026-09-30', inMonth: true })
    expect(weeks[4][3]).toEqual({ date: '2026-10-01', inMonth: false })
    expect(weeks.every(week => week.length === 7)).toBe(true)
  })

  test('week starts fall on the Monday of that week', () => {
    expect(getWeekStart(new Date(2026, 8, 13))).toBe('2026-09-07')
    expect(getWeekStart(new Date(2026, 8, 7))).toBe('2026-09-07')
  })
})

describe('workouts by date', () => {
  test('groups workouts, keeping two on the same day together', () => {
    const byDate = getWorkoutsByDate([workout('2026-09-07'), workout('2026-09-09', 'a'), workout('2026-09-09', 'b')])

    expect(byDate.get('2026-09-07')).toHaveLength(1)
    expect(byDate.get('2026-09-09')?.map(w => w.id)).toEqual(['a', 'b'])
    expect(byDate.get('2026-09-08')).toBeUndefined()
  })
})

describe('training stats', () => {
  const sunday = new Date(2026, 8, 13)

  test('counts this week and the run of weeks before it', () => {
    const workouts = [
      workout('2026-09-02'),
      workout('2026-09-07'),
      workout('2026-09-09'),
      workout('2026-09-11'),
    ]

    expect(getTrainingStats(workouts, sunday)).toEqual({
      thisWeek: 3,
      streakWeeks: 2,
      longestStreakWeeks: 2,
    })
  })

  test('an empty current week does not break the streak yet', () => {
    const workouts = [workout('2026-08-26'), workout('2026-09-04')]

    expect(getTrainingStats(workouts, sunday)).toMatchObject({ thisWeek: 0, streakWeeks: 2 })
  })

  test('a missed week ends the streak but is kept as the longest', () => {
    const workouts = [
      workout('2026-08-10'),
      workout('2026-08-17'),
      workout('2026-08-24'),
      workout('2026-09-09'),
    ]

    expect(getTrainingStats(workouts, sunday)).toEqual({
      thisWeek: 1,
      streakWeeks: 1,
      longestStreakWeeks: 3,
    })
  })

  test('no workouts means no streak', () => {
    expect(getTrainingStats([], sunday)).toEqual({ thisWeek: 0, streakWeeks: 0, longestStreakWeeks: 0 })
  })
})
