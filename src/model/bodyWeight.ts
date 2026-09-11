import type { AppState, BodyWeightEntry } from './types'
import { localDateString } from './dates'

function byDate(a: BodyWeightEntry, b: BodyWeightEntry): number {
  return a.date.localeCompare(b.date)
}

// One entry per day: saving to a date that already has one replaces it. `previousDate` is the
// entry's old date when an edit moves it to a different day.
export function saveBodyWeight(state: AppState, entry: BodyWeightEntry, previousDate?: string): AppState {
  const others = (state.bodyWeights ?? []).filter(e => e.date !== entry.date && e.date !== previousDate)
  return { ...state, bodyWeights: [...others, entry].sort(byDate) }
}

export function deleteBodyWeight(state: AppState, date: string): AppState {
  return { ...state, bodyWeights: (state.bodyWeights ?? []).filter(e => e.date !== date) }
}

// Compares the latest weigh-in with the last one at least `days` earlier, or with the first
// weigh-in when there is none that old.
export function getBodyWeightChange(
  entries: BodyWeightEntry[],
  days: number,
): { change: number; since: string } | null {
  if (entries.length < 2) return null
  const sorted = [...entries].sort(byDate)
  const latest = sorted[sorted.length - 1]
  const cutoff = new Date(latest.date + 'T00:00:00')
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffDate = localDateString(cutoff)
  const reference = [...sorted].reverse().find(e => e.date <= cutoffDate) ?? sorted[0]
  return { change: Math.round((latest.weight - reference.weight) * 10) / 10, since: reference.date }
}

export function formatWeightChange(change: number, units: string): string {
  if (change === 0) return 'no change'
  const amount = Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 1 })
  return `${change > 0 ? '+' : '−'}${amount} ${units}`
}
