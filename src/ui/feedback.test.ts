import { afterEach, describe, expect, test, vi } from 'vitest'
import { vibrateTap } from './feedback'

afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).vibrate
})

describe('vibrateTap', () => {
  test('gives a short vibration where the browser supports it', () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })

    vibrateTap()

    expect(vibrate).toHaveBeenCalledWith(10)
  })

  test('does nothing, and adds no hidden controls, on browsers without the Vibration API', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true })

    expect(() => vibrateTap()).not.toThrow()
    expect(document.querySelector('input[switch]')).toBeNull()
  })
})
