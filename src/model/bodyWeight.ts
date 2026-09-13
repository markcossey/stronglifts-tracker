import type { AppState, BodyWeightEntry, BodyWeightUnits, Units } from './types'
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

export function saveBodyWeightUnits(state: AppState, units: BodyWeightUnits): AppState {
  return state.bodyWeightUnits === units ? state : { ...state, bodyWeightUnits: units }
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

const LB_PER_KG = 2.20462
const LB_PER_STONE = 14

// Stone is shown as whole stones plus pounds, so its numbers are carried in pounds.
export function numericUnits(units: BodyWeightUnits): Units {
  return units === 'st' ? 'lb' : units
}

function convert(weight: number, from: Units, to: Units): number {
  if (from === to) return weight
  return from === 'kg' ? weight * LB_PER_KG : weight / LB_PER_KG
}

// Weigh-ins are stored in the app's units; these move them to and from the units they're shown in.
export function toShownWeight(weight: number, stored: Units, shown: BodyWeightUnits): number {
  return convert(weight, stored, numericUnits(shown))
}

export function toStoredWeight(weight: number, shown: BodyWeightUnits, stored: Units): number {
  return Math.round(convert(weight, numericUnits(shown), stored) * 100) / 100
}

export function shownBodyWeights(entries: BodyWeightEntry[], stored: Units, shown: BodyWeightUnits): BodyWeightEntry[] {
  return entries.map(e => ({ ...e, weight: toShownWeight(e.weight, stored, shown) }))
}

export function splitStones(pounds: number): { stones: number; pounds: number } {
  const tenths = Math.round(pounds * 10)
  const perStone = LB_PER_STONE * 10
  return { stones: Math.floor(tenths / perStone), pounds: (tenths % perStone) / 10 }
}

export function joinStones(stones: number, pounds: number): number {
  return stones * LB_PER_STONE + pounds
}

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

// `weight` is already in the shown units (pounds for stone).
export function bodyWeightParts(weight: number, units: BodyWeightUnits): { value: string; unit: string }[] {
  if (units !== 'st') return [{ value: formatNumber(weight), unit: units }]
  const { stones, pounds } = splitStones(weight)
  return [
    { value: String(stones), unit: 'st' },
    { value: formatNumber(pounds), unit: 'lb' },
  ]
}

export function formatBodyWeight(weight: number, units: BodyWeightUnits): string {
  return bodyWeightParts(weight, units).map(p => `${p.value} ${p.unit}`).join(' ')
}
