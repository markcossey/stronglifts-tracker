import { useState } from 'react'
import type { Workout } from '../model/types'
import { getMonthGrid, getTrainingStats, getWorkoutsByDate } from '../model/calendar'
import { isExerciseComplete } from '../model/programme'
import { formatDate, localDateString } from '../model/dates'

interface WorkoutCalendarProps {
  workouts: Workout[]
  onSelectWorkout: (workout: Workout) => void
}

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function WorkoutCalendar({ workouts, onSelectWorkout }: WorkoutCalendarProps) {
  const [shown, setShown] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const today = new Date()
  const todayDate = localDateString(today)
  const weeks = getMonthGrid(shown.year, shown.month)
  const byDate = getWorkoutsByDate(workouts)
  const stats = getTrainingStats(workouts, today)
  const monthLabel = new Date(shown.year, shown.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
  const atCurrentMonth = shown.year === today.getFullYear() && shown.month === today.getMonth()

  function shiftMonth(delta: number) {
    setShown(prev => {
      const shifted = new Date(prev.year, prev.month + delta, 1)
      return { year: shifted.getFullYear(), month: shifted.getMonth() }
    })
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
          className="p-1 text-gray-400 hover:text-gray-200"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-gray-200">{monthLabel}</h2>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={atCurrentMonth}
          aria-label="Next month"
          className="p-1 text-gray-400 hover:text-gray-200 disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-600">
        {WEEKDAY_INITIALS.map((initial, i) => (
          <div key={i}>{initial}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map(day => {
          const dayWorkouts = byDate.get(day.date) ?? []
          const workout = dayWorkouts[dayWorkouts.length - 1]
          const dayNumber = Number(day.date.slice(-2))
          const isToday = day.date === todayDate

          if (!workout) {
            return (
              <div
                key={day.date}
                className={`aspect-square flex items-center justify-center text-xs rounded-full ${
                  day.inMonth ? 'text-gray-500' : 'text-gray-700'
                } ${isToday ? 'ring-1 ring-gray-600' : ''}`}
              >
                {dayNumber}
              </div>
            )
          }

          const allComplete = workout.exercises.every(isExerciseComplete)
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectWorkout(workout)}
              aria-label={`Workout ${workout.type} on ${formatDate(day.date)}`}
              className={`aspect-square flex items-center justify-center text-xs font-bold rounded-full transition-colors ${
                allComplete ? 'bg-[#3da836] text-white hover:bg-[#47c23f]' : 'bg-amber-500/80 text-gray-950 hover:bg-amber-500'
              } ${day.inMonth ? '' : 'opacity-40'} ${isToday ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-gray-300' : ''}`}
            >
              {workout.type}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-gray-500 pt-1 border-t border-gray-800">
        {stats.thisWeek} this week
        {' · '}
        {stats.streakWeeks > 0 ? `${stats.streakWeeks} week streak` : 'no streak yet'}
        {stats.longestStreakWeeks > 0 && ` · best ${stats.longestStreakWeeks}`}
      </p>
    </div>
  )
}
