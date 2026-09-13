import { describe, expect, test } from 'vitest'
import { getRestDuration, REST_AFTER_MISS, REST_AFTER_SET } from './rest'

describe('getRestDuration', () => {
  test('rests three minutes after a completed set', () => {
    expect(getRestDuration(true)).toBe(REST_AFTER_SET)
    expect(REST_AFTER_SET).toBe(180)
  })

  test('rests five minutes after a missed set', () => {
    expect(getRestDuration(false)).toBe(REST_AFTER_MISS)
    expect(REST_AFTER_MISS).toBe(300)
  })
})
