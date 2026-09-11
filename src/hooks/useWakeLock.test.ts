import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

function makeSentinel() {
  const target = new EventTarget()
  return Object.assign(target, {
    release: vi.fn(async () => {
      target.dispatchEvent(new Event('release'))
    }),
  })
}

let sentinels: ReturnType<typeof makeSentinel>[]
let request: ReturnType<typeof vi.fn>

beforeEach(() => {
  sentinels = []
  request = vi.fn(async () => {
    const sentinel = makeSentinel()
    sentinels.push(sentinel)
    return sentinel
  })
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
})

afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).wakeLock
})

describe('useWakeLock', () => {
  test('requests a screen wake lock when the app opens', async () => {
    renderHook(() => useWakeLock())
    await waitFor(() => expect(request).toHaveBeenCalledWith('screen'))
    expect(request).toHaveBeenCalledTimes(1)
  })

  test('re-requests the lock when the app becomes visible after the browser released it', async () => {
    renderHook(() => useWakeLock())
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))

    sentinels[0].dispatchEvent(new Event('release'))
    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
  })

  test('does not request a second lock while one is held', async () => {
    renderHook(() => useWakeLock())
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))

    document.dispatchEvent(new Event('pointerdown'))
    document.dispatchEvent(new Event('visibilitychange'))
    await new Promise(r => setTimeout(r, 20))

    expect(request).toHaveBeenCalledTimes(1)
  })

  test('releases the lock when the app closes', async () => {
    const { unmount } = renderHook(() => useWakeLock())
    await waitFor(() => expect(sentinels).toHaveLength(1))

    unmount()

    expect(sentinels[0].release).toHaveBeenCalled()
  })
})
