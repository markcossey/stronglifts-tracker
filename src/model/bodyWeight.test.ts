import { describe, expect, test } from 'vitest'
import { deleteBodyWeight, formatWeightChange, getBodyWeightChange, saveBodyWeight } from './bodyWeight'
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
})
