import type { Workout } from './types'
import { localDateString } from './dates'

export interface CalendarDay {
  date: string
  inMonth: boolean
}

export interface TrainingStats {
  thisWeek: number
  streakWeeks: number
  longestStreakWeeks: number
}

// Weeks run Monday to Sunday
export function getWeekStart(date: Date): string {
  const start = new Date(date)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return localDateString(start)
}

function addWeek(weekStart: string): string {
  const next = new Date(weekStart + 'T00:00:00')
  next.setDate(next.getDate() + 7)
  return localDateString(next)
}

export function getMonthGrid(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const cursor = new Date(getWeekStart(firstOfMonth) + 'T00:00:00')
  const weeks: CalendarDay[][] = []

  do {
    const week: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
      week.push({ date: localDateString(cursor), inMonth: cursor.getMonth() === month })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  } while (cursor <= lastOfMonth)

  return weeks
}

export function getWorkoutsByDate(workouts: Workout[]): Map<string, Workout[]> {
  const byDate = new Map<string, Workout[]>()
  for (const workout of workouts) {
    const existing = byDate.get(workout.date)
    if (existing) existing.push(workout)
    else byDate.set(workout.date, [workout])
  }
  return byDate
}

export function getTrainingStats(workouts: Workout[], today = new Date()): TrainingStats {
  const weeks = new Map<string, number>()
  for (const workout of workouts) {
    const weekStart = getWeekStart(new Date(workout.date + 'T00:00:00'))
    weeks.set(weekStart, (weeks.get(weekStart) ?? 0) + 1)
  }

  const thisWeek = weeks.get(getWeekStart(today)) ?? 0

  // A current week with no workouts yet doesn't break the streak until it ends
  const cursor = new Date(today)
  if (thisWeek === 0) cursor.setDate(cursor.getDate() - 7)
  let streakWeeks = 0
  while ((weeks.get(getWeekStart(cursor)) ?? 0) > 0) {
    streakWeeks++
    cursor.setDate(cursor.getDate() - 7)
  }

  let longestStreakWeeks = 0
  let run = 0
  let previous: string | null = null
  for (const weekStart of [...weeks.keys()].sort()) {
    run = previous && addWeek(previous) === weekStart ? run + 1 : 1
    longestStreakWeeks = Math.max(longestStreakWeeks, run)
    previous = weekStart
  }

  return { thisWeek, streakWeeks, longestStreakWeeks }
}
