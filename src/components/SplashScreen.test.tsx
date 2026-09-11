import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import SplashScreen from './SplashScreen'

interface FakeAnimation {
  target: Element
  keyframes: Keyframe[]
  options: KeyframeAnimationOptions
  finished: Promise<unknown>
  finish: () => void
  cancel: ReturnType<typeof vi.fn>
}

let frameQueue: FrameRequestCallback[]
let animations: FakeAnimation[]

function fakeAnimate(this: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  let resolve!: (value: unknown) => void
  let reject!: (reason: unknown) => void
  const finished = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  finished.catch(() => {})
  const animation: FakeAnimation = {
    target: this,
    keyframes,
    options,
    finished,
    finish: () => resolve(animation),
    cancel: vi.fn(() => reject(new DOMException('Cancelled', 'AbortError'))),
  }
  animations.push(animation)
  return animation
}

function flushFrame() {
  const callbacks = frameQueue.splice(0)
  callbacks.forEach(cb => cb(performance.now()))
}

async function settle() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

beforeEach(() => {
  frameQueue = []
  animations = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frameQueue.push(cb))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    delete frameQueue[id - 1]
  })
  Object.defineProperty(Element.prototype, 'animate', { value: fakeAnimate, configurable: true, writable: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete (Element.prototype as unknown as Record<string, unknown>).animate
})

describe('SplashScreen', () => {
  test('waits for the first painted frame before starting the scale-in', () => {
    render(<SplashScreen onDone={() => {}} />)

    expect(animations).toHaveLength(0)
    flushFrame()
    expect(animations).toHaveLength(0)
    flushFrame()

    expect(animations).toHaveLength(1)
    expect(animations[0].target.tagName.toLowerCase()).toBe('svg')
    expect(animations[0].keyframes).toEqual([{ transform: 'scale(0.85)' }, { transform: 'scale(1)' }])
  })

  test('fades only after the scale-in finishes, and hands over only after the fade ends', async () => {
    const onDone = vi.fn()
    render(<SplashScreen onDone={onDone} />)
    flushFrame()
    flushFrame()

    await act(async () => animations[0].finish())
    await settle()

    expect(animations).toHaveLength(2)
    expect(animations[1].target.tagName.toLowerCase()).toBe('div')
    expect(animations[1].keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }])
    expect(onDone).not.toHaveBeenCalled()

    await act(async () => animations[1].finish())
    await settle()

    expect(onDone).toHaveBeenCalledTimes(1)
  })

  test('cancels its animation and never hands over when unmounted mid-animation', async () => {
    const onDone = vi.fn()
    const { unmount } = render(<SplashScreen onDone={onDone} />)
    flushFrame()
    flushFrame()

    unmount()
    await settle()

    expect(animations[0].cancel).toHaveBeenCalled()
    expect(onDone).not.toHaveBeenCalled()
  })

  test('never starts if unmounted before the first frame', () => {
    const { unmount } = render(<SplashScreen onDone={() => {}} />)

    unmount()
    flushFrame()
    flushFrame()

    expect(animations).toHaveLength(0)
  })
})
