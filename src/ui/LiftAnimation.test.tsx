import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import LiftAnimation from './LiftAnimation'

const base = import.meta.env.BASE_URL

function setReducedMotion(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: reduced,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  })
}

function visibleFrame(): string | null {
  const frames = [...document.querySelectorAll('img')]
  const shown = frames.find(img => img.className.includes('opacity-100'))
  return shown?.getAttribute('src') ?? null
}

afterEach(() => {
  vi.useRealTimers()
  delete (window as unknown as Record<string, unknown>).matchMedia
})

describe('LiftAnimation', () => {
  test('stacks the three illustration frames for the lift', () => {
    render(<LiftAnimation liftId="bench" />)

    const frames = [...document.querySelectorAll('img')]
    expect(frames.map(img => img.getAttribute('src'))).toEqual([
      `${base}lifts/bench-press-1.svg`,
      `${base}lifts/bench-press-2.svg`,
      `${base}lifts/bench-press-3.svg`,
    ])
    expect(screen.getByRole('img', { name: 'Animation of the Bench Press' })).toBeTruthy()
  })

  test('cycles start → middle → end → middle', () => {
    vi.useFakeTimers()
    render(<LiftAnimation liftId="squat" />)

    expect(visibleFrame()).toBe(`${base}lifts/squat-1.svg`)
    act(() => void vi.advanceTimersByTime(650))
    expect(visibleFrame()).toBe(`${base}lifts/squat-2.svg`)
    act(() => void vi.advanceTimersByTime(650))
    expect(visibleFrame()).toBe(`${base}lifts/squat-3.svg`)
    act(() => void vi.advanceTimersByTime(650))
    expect(visibleFrame()).toBe(`${base}lifts/squat-2.svg`)
    act(() => void vi.advanceTimersByTime(650))
    expect(visibleFrame()).toBe(`${base}lifts/squat-1.svg`)
  })

  test('holds on the first frame when reduced motion is on', () => {
    setReducedMotion(true)
    vi.useFakeTimers()
    render(<LiftAnimation liftId="deadlift" />)

    expect(visibleFrame()).toBe(`${base}lifts/deadlift-1.svg`)
    act(() => void vi.advanceTimersByTime(3000))
    expect(visibleFrame()).toBe(`${base}lifts/deadlift-1.svg`)
  })
})
