import { describe, expect, it } from 'vitest'
import { createAppState } from '../model/programme'
import type { AppState, Workout } from '../model/types'
import { mergeStates } from './merge'

const weights = { squat: 60, bench: 40, row: 40, ohp: 30, deadlift: 80 }

function workout(id: string, date: string, notes?: string): Workout {
  return { id, date, type: 'A', exercises: [], startTime: `${date}T09:00:00.000Z`, ...(notes ? { notes } : {}) }
}

function withWorkouts(state: AppState, ...workouts: Workout[]): AppState {
  return { ...state, workouts }
}

describe('mergeStates', () => {
  const base = withWorkouts(createAppState('kg', weights), workout('w1', '2026-11-01'))

  it('keeps workouts added on both devices, in date order', () => {
    const local = withWorkouts(base, ...base.workouts, workout('w3', '2026-11-05'))
    const remote = withWorkouts(base, ...base.workouts, workout('w2', '2026-11-03'))
    const merged = mergeStates(base, local, remote)
    expect(merged.workouts.map(w => w.id)).toEqual(['w1', 'w2', 'w3'])
  })

  it('drops a workout deleted on one device and untouched on the other', () => {
    const local = withWorkouts(base)
    const merged = mergeStates(base, local, base)
    expect(merged.workouts).toEqual([])
    expect(mergeStates(base, base, local).workouts).toEqual([])
  })

  it('keeps an edit when the other device deleted the same workout', () => {
    const edited = withWorkouts(base, workout('w1', '2026-11-01', 'felt strong'))
    const deleted = withWorkouts(base)
    expect(mergeStates(base, edited, deleted).workouts[0].notes).toBe('felt strong')
  })

  it("prefers this device's version when both edited the same workout", () => {
    const local = withWorkouts(base, workout('w1', '2026-11-01', 'local'))
    const remote = withWorkouts(base, workout('w1', '2026-11-01', 'remote'))
    expect(mergeStates(base, local, remote).workouts[0].notes).toBe('local')
  })

  it('takes a setting changed on only one side', () => {
    const remote = { ...base, tapFeedback: { sound: false, haptics: true } }
    expect(mergeStates(base, base, remote).tapFeedback).toEqual({ sound: false, haptics: true })
  })

  it('takes lift weights from the side with the most recent workout when both changed', () => {
    const local = {
      ...withWorkouts(base, ...base.workouts, workout('w2', '2026-11-03')),
      lifts: { ...base.lifts, squat: { ...base.lifts.squat, currentWeight: 62.5 } },
    }
    const remote = {
      ...withWorkouts(base, ...base.workouts, workout('w3', '2026-11-05')),
      lifts: { ...base.lifts, squat: { ...base.lifts.squat, currentWeight: 65 } },
    }
    expect(mergeStates(base, local, remote).lifts.squat.currentWeight).toBe(65)
  })

  it('lets a real history replace a fresh setup-wizard state on first sync', () => {
    const fresh = createAppState('lb', { squat: 45, bench: 45, row: 65, ohp: 45, deadlift: 95 })
    const real = { ...withWorkouts(base, ...base.workouts, workout('w2', '2026-11-03')), bodyWeights: [{ date: '2026-11-03', weight: 80 }] }
    const merged = mergeStates(null, fresh, real)
    expect(merged).toEqual(real)
  })

  it('merges body weights by date and reviews by month', () => {
    const b = { ...base, bodyWeights: [{ date: '2026-11-01', weight: 80 }], reviews: [] }
    const local = { ...b, bodyWeights: [...b.bodyWeights, { date: '2026-11-04', weight: 79.5 }] }
    const remote = {
      ...b,
      bodyWeights: [...b.bodyWeights, { date: '2026-11-02', weight: 79.8 }],
      reviews: [{ month: '2026-10', markdown: '# Oct', savedAt: '2026-11-01T10:00:00Z' }],
    }
    const merged = mergeStates(b, local, remote)
    expect(merged.bodyWeights?.map(e => e.date)).toEqual(['2026-11-01', '2026-11-02', '2026-11-04'])
    expect(merged.reviews?.map(r => r.month)).toEqual(['2026-10'])
  })
})
