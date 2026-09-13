import { describe, expect, test } from 'vitest'
import { LIFT_TECHNIQUE } from './technique'
import { ALL_LIFTS } from './defaults'

describe('lift technique content', () => {
  test.each(ALL_LIFTS)('%s has a summary and cues for setup, execution and mistakes', liftId => {
    const technique = LIFT_TECHNIQUE[liftId]

    expect(technique.summary.length).toBeGreaterThan(20)
    expect(technique.setup.length).toBeGreaterThanOrEqual(3)
    expect(technique.execution.length).toBeGreaterThanOrEqual(3)
    expect(technique.mistakes.length).toBeGreaterThanOrEqual(3)
    expect([...technique.setup, ...technique.execution, ...technique.mistakes].every(cue => cue.length > 10)).toBe(true)
  })

  test('cues are unique within each lift, so list keys stay stable', () => {
    for (const liftId of ALL_LIFTS) {
      const technique = LIFT_TECHNIQUE[liftId]
      for (const cues of [technique.setup, technique.execution, technique.mistakes]) {
        expect(new Set(cues).size).toBe(cues.length)
      }
    }
  })
})
