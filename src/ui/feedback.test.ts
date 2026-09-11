import { afterEach, describe, expect, test, vi } from 'vitest'
import { tapHaptic } from './feedback'

afterEach(() => {
  vi.restoreAllMocks()
  delete (navigator as unknown as Record<string, unknown>).vibrate
})

describe('tapHaptic', () => {
  test('uses the vibration API where the browser supports it', () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    const click = vi.spyOn(HTMLLabelElement.prototype, 'click')

    tapHaptic()

    expect(vibrate).toHaveBeenCalledWith(10)
    expect(click).not.toHaveBeenCalled()
  })

  test('falls back to toggling a hidden iOS switch control, then removes it', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true })
    const clicked: { input: HTMLInputElement | null } = { input: null }
    const click = vi.spyOn(HTMLLabelElement.prototype, 'click').mockImplementation(function (this: HTMLLabelElement) {
      clicked.input = this.querySelector('input')
    })

    tapHaptic()

    expect(click).toHaveBeenCalledTimes(1)
    expect(clicked.input?.type).toBe('checkbox')
    expect(clicked.input?.hasAttribute('switch')).toBe(true)
    expect(document.querySelector('input[switch]')).toBeNull()
  })
})
