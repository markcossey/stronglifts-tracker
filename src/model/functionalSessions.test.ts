import { describe, expect, test } from 'vitest'
import { FUNCTIONAL_SESSIONS, getFunctionalSession } from './functionalSessions'
import { FUNCTIONAL_CATEGORY } from './types'

const AVAILABLE_EQUIPMENT = new Set([
  'Barbell',
  'Landmine attachment',
  'Resistance band',
  'Kettlebell',
  'Ab roller',
])

const OVERHEAD_PATTERN = /overhead|pull-up|pull up/i

describe('FUNCTIONAL_SESSIONS', () => {
  test('has both sessions tagged with the Functional / Maintenance category', () => {
    expect(FUNCTIONAL_SESSIONS.map(s => s.id)).toEqual(['fm1', 'fm2'])
    for (const session of FUNCTIONAL_SESSIONS) {
      expect(session.category).toBe(FUNCTIONAL_CATEGORY)
      expect(session.targetRPE).toBe('5-6')
      expect(session.targetDurationMinutes).toEqual([25, 30])
    }
  })

  test('only uses equipment from the available list', () => {
    for (const session of FUNCTIONAL_SESSIONS) {
      for (const exercise of session.exercises) {
        for (const item of exercise.equipment) {
          expect(AVAILABLE_EQUIPMENT.has(item)).toBe(true)
        }
      }
    }
  })

  test('never prescribes an overhead movement', () => {
    for (const session of FUNCTIONAL_SESSIONS) {
      for (const exercise of session.exercises) {
        expect(exercise.name).not.toMatch(OVERHEAD_PATTERN)
        expect(exercise.prescription).not.toMatch(OVERHEAD_PATTERN)
        expect(exercise.cue ?? '').not.toMatch(/\brequires? overhead\b/i)
      }
    }
  })

  test('every exercise has a unique id within its session and at least one set', () => {
    for (const session of FUNCTIONAL_SESSIONS) {
      const ids = session.exercises.map(e => e.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const exercise of session.exercises) {
        expect(exercise.sets).toBeGreaterThan(0)
      }
    }
  })

  test('fm1 covers warm-up, main and cool-down work for hips/legs/core', () => {
    const fm1 = getFunctionalSession('fm1')!
    expect(fm1.name).toBe('Functional / Maintenance 1')
    expect(fm1.exercises.filter(e => e.section === 'warmup')).toHaveLength(4)
    expect(fm1.exercises.filter(e => e.section === 'main')).toHaveLength(3)
    expect(fm1.exercises.filter(e => e.section === 'cooldown')).toHaveLength(3)

    const landmineLunge = fm1.exercises.find(e => e.id === 'landmine-reverse-lunge')!
    expect(landmineLunge.sets).toBe(3)
    expect(landmineLunge.equipment).toEqual(['Barbell', 'Landmine attachment'])
  })

  test('fm2 covers upper-back/shoulder work and marks cool-down stretches optional', () => {
    const fm2 = getFunctionalSession('fm2')!
    expect(fm2.name).toBe('Functional / Maintenance 2')
    expect(fm2.exercises.filter(e => e.section === 'main')).toHaveLength(4)

    const cooldown = fm2.exercises.filter(e => e.section === 'cooldown')
    expect(cooldown).toHaveLength(4)
    expect(cooldown.every(e => e.optional)).toBe(true)

    const press = fm2.exercises.find(e => e.id === 'half-kneeling-landmine-press')!
    expect(press.cue).toMatch(/no overhead press or overhead clearance/i)
  })

  test('getFunctionalSession returns undefined for an unknown id', () => {
    expect(getFunctionalSession('nope')).toBeUndefined()
  })
})
