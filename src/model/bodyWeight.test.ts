import { describe, expect, test } from 'vitest'
import {
  bodyWeightParts,
  deleteBodyWeight,
  formatBodyWeight,
  formatWeightChange,
  getBodyWeightChange,
  saveBodyWeight,
  saveBodyWeightUnits,
  shownBodyWeights,
  splitStones,
  toShownWeight,
  toStoredWeight,
} from './bodyWeight'
import { convertStateUnits, createAppState } from './programme'
import { DEFAULT_STARTING_WEIGHTS_KG } from './defaults'

const base = createAppState('kg', DEFAULT_STARTING_WEIGHTS_KG)

describe('body weight', () => {
  test('saving keeps one entry per day, sorted by date', () => {
    let state = saveBodyWeight(base, { date: '2026-09-10', weight: 83.2 })
    state = saveBodyWeight(state, { date: '2026-09-01', weight: 84 })
    state = saveBodyWeight(state, { date: '2026-09-10', weight: 83 })

    expect(state.bodyWeights).toEqual([
      { date: '2026-09-01', weight: 84 },
      { date: '2026-09-10', weight: 83 },
    ])
  })

  test('editing an entry can move it to another date', () => {
    let state = saveBodyWeight(base, { date: '2026-09-10', weight: 83.2 })
    state = saveBodyWeight(state, { date: '2026-09-09', weight: 83.4 }, '2026-09-10')

    expect(state.bodyWeights).toEqual([{ date: '2026-09-09', weight: 83.4 }])
  })

  test('deleting removes only that day', () => {
    let state = saveBodyWeight(base, { date: '2026-09-01', weight: 84 })
    state = saveBodyWeight(state, { date: '2026-09-10', weight: 83.2 })

    expect(deleteBodyWeight(state, '2026-09-01').bodyWeights).toEqual([{ date: '2026-09-10', weight: 83.2 }])
  })

  test('change compares with the last weigh-in at least N days earlier', () => {
    const entries = [
      { date: '2026-07-01', weight: 85 },
      { date: '2026-08-05', weight: 84.5 },
      { date: '2026-08-20', weight: 84 },
      { date: '2026-09-10', weight: 83.2 },
    ]

    expect(getBodyWeightChange(entries, 30)).toEqual({ change: -1.3, since: '2026-08-05' })
  })

  test('change falls back to the first weigh-in when none is old enough', () => {
    const entries = [
      { date: '2026-09-01', weight: 84 },
      { date: '2026-09-10', weight: 83.2 },
    ]

    expect(getBodyWeightChange(entries, 30)).toEqual({ change: -0.8, since: '2026-09-01' })
    expect(getBodyWeightChange(entries.slice(0, 1), 30)).toBeNull()
  })

  test('formats changes with a sign and units', () => {
    expect(formatWeightChange(-1.3, 'kg')).toBe('−1.3 kg')
    expect(formatWeightChange(0.5, 'lb')).toBe('+0.5 lb')
    expect(formatWeightChange(0, 'kg')).toBe('no change')
  })

  test('switching units converts body weights', () => {
    const state = saveBodyWeight(base, { date: '2026-09-10', weight: 80 })

    expect(convertStateUnits(state, 'lb').bodyWeights).toEqual([{ date: '2026-09-10', weight: 176.4 }])
  })

  test('remembers the units body weight is logged in', () => {
    expect(base.bodyWeightUnits).toBeUndefined()
    expect(saveBodyWeightUnits(base, 'st').bodyWeightUnits).toBe('st')
  })

  test('converts between stored and shown units, carrying stone in pounds', () => {
    expect(toShownWeight(80, 'kg', 'kg')).toBe(80)
    expect(toShownWeight(80, 'kg', 'lb')).toBeCloseTo(176.37, 2)
    expect(toShownWeight(80, 'kg', 'st')).toBeCloseTo(176.37, 2)
    expect(toStoredWeight(176.4, 'st', 'kg')).toBe(80.01)
    expect(toStoredWeight(83.2, 'kg', 'kg')).toBe(83.2)
    expect(shownBodyWeights([{ date: '2026-09-10', weight: 180 }], 'lb', 'kg')[0].weight).toBeCloseTo(81.65, 2)
  })

  test('a weight logged in stone reads back the same', () => {
    const stored = toStoredWeight(13 * 14 + 6.2, 'st', 'kg')
    expect(formatBodyWeight(toShownWeight(stored, 'kg', 'st'), 'st')).toBe('13 st 6.2 lb')
  })

  test('splits pounds into stones and pounds, carrying a rounded-up 14', () => {
    expect(splitStones(188.5)).toEqual({ stones: 13, pounds: 6.5 })
    expect(splitStones(195.97)).toEqual({ stones: 14, pounds: 0 })
  })

  test('formats body weight in each unit', () => {
    expect(formatBodyWeight(83.25, 'kg')).toBe('83.3 kg')
    expect(formatBodyWeight(183.4, 'lb')).toBe('183.4 lb')
    expect(bodyWeightParts(188.5, 'st')).toEqual([
      { value: '13', unit: 'st' },
      { value: '6.5', unit: 'lb' },
    ])
  })
})
