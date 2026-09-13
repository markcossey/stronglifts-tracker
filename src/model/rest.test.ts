import { describe, expect, test } from 'vitest'
import { getRestDuration, REST_AFTER_EASY, REST_AFTER_HARD, REST_AFTER_MISS } from './rest'

describe('getRestDuration', () => {
  test('rests briefly after the opening sets of a lift', () => {
    expect(getRestDuration(0, true)).toBe(REST_AFTER_EASY)
    expect(getRestDuration(1, true)).toBe(REST_AFTER_EASY)
  })

  test('rests longer once the sets get hard', () => {
    expect(getRestDuration(2, true)).toBe(REST_AFTER_HARD)
    expect(getRestDuration(4, true)).toBe(REST_AFTER_HARD)
  })

  test('rests longest after a missed set, wherever it happens', () => {
    expect(getRestDuration(0, false)).toBe(REST_AFTER_MISS)
    expect(getRestDuration(4, false)).toBe(REST_AFTER_MISS)
  })
})
