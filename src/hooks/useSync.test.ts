import { act, renderHook, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppState, exportData } from '../model/programme'
import type { AppState } from '../model/types'
import { useSync } from './useSync'

const weights = { squat: 60, bench: 40, row: 40, ohp: 30, deadlift: 80 }

/** A tiny in-memory stand-in for the PHP API. */
function fakeServer(initial: { revision: number; state: AppState | null }) {
  const server = { ...initial, posts: [] as { baseRevision: number; state: AppState }[] }
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
    if (url.endsWith('login.php')) {
      const { passcode } = JSON.parse(String(init?.body))
      return passcode === 'right-passcode' ? json(200, { token: 'a'.repeat(64) }) : json(401, { error: 'wrong_passcode' })
    }
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body))
      server.posts.push(body)
      if (body.baseRevision !== server.revision) return json(409, { error: 'conflict', revision: server.revision })
      server.revision += 1
      server.state = body.state
      return json(200, { revision: server.revision })
    }
    return json(200, { revision: server.revision, state: server.state })
  })
  vi.stubGlobal('fetch', fetchMock)
  return server
}

function renderSync(initial: AppState | null) {
  return renderHook(() => {
    const [state, setState] = useState<AppState | null>(initial)
    const sync = useSync(state, setState)
    return { state, setState, sync }
  })
}

describe('useSync', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('loads the server copy onto a fresh device after entering the passcode', async () => {
    const saved = { ...createAppState('kg', weights), workouts: [{ id: 'w1', date: '2026-11-20', type: 'A' as const, exercises: [] }] }
    fakeServer({ revision: 5, state: saved })
    const { result } = renderSync(null)

    await act(() => result.current.sync.connect('right-passcode'))

    await waitFor(() => expect(result.current.state?.workouts).toHaveLength(1))
    expect(result.current.sync.connected).toBe(true)
    expect(result.current.sync.phase).toBe('idle')
  })

  it('uploads existing data when the server is empty', async () => {
    const local = createAppState('kg', weights)
    const server = fakeServer({ revision: 0, state: null })
    const { result } = renderSync(local)

    await act(() => result.current.sync.connect('right-passcode'))

    await waitFor(() => expect(server.revision).toBe(1))
    expect(exportData(server.state!)).toBe(exportData(local))
  })

  it('rejects a wrong passcode without connecting', async () => {
    fakeServer({ revision: 0, state: null })
    const { result } = renderSync(null)

    await expect(result.current.sync.connect('nope')).rejects.toThrow("isn't right")
    expect(result.current.sync.connected).toBe(false)
  })

  it('pushes a local change, building on the latest server revision', async () => {
    const local = createAppState('kg', weights)
    const server = fakeServer({ revision: 0, state: null })
    const { result } = renderSync(local)
    await act(() => result.current.sync.connect('right-passcode'))
    await waitFor(() => expect(server.revision).toBe(1))

    act(() => result.current.setState(s => ({ ...s!, tapFeedback: { sound: false, haptics: false } })))

    await waitFor(() => expect(server.revision).toBe(2), { timeout: 4000 })
    expect(server.posts[server.posts.length - 1]?.baseRevision).toBe(1)
    expect(server.state?.tapFeedback).toEqual({ sound: false, haptics: false })
  })
})
