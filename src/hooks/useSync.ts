import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppState } from '../model/types'
import { exportData, importData } from '../model/programme'
import { fetchRemote, guessDeviceName, login, pushRemote, SyncError } from '../sync/api'
import { mergeStates } from '../sync/merge'

// What this device knows about the server copy. `base` is the state exactly as last
// synced: comparing it with the current state tells us whether there are unsynced
// local changes, and it's the common ancestor for merging.
const META_KEY = 'stronglifts-sync'
const BASE_KEY = 'stronglifts-sync-base'

interface SyncMeta {
  token: string
  revision: number
  lastSyncedAt?: string
}

export type SyncPhase = 'idle' | 'syncing' | 'error'

export interface SyncStatus {
  connected: boolean
  phase: SyncPhase
  lastSyncedAt?: string
  error?: string
}

export interface SyncControls extends SyncStatus {
  connect: (passcode: string) => Promise<void>
  disconnect: () => void
  syncNow: () => void
}

const PUSH_DELAY_MS = 1500
const POLL_MS = 60_000

function loadMeta(): SyncMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? (JSON.parse(raw) as SyncMeta) : null
  } catch {
    return null
  }
}

function saveMeta(meta: SyncMeta | null) {
  if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta))
  else localStorage.removeItem(META_KEY)
}

function loadBase(): string | null {
  return localStorage.getItem(BASE_KEY)
}

function saveBase(json: string | null) {
  if (json === null) localStorage.removeItem(BASE_KEY)
  else localStorage.setItem(BASE_KEY, json)
}

function parse(json: string | null): AppState | null {
  if (!json) return null
  const result = importData(json)
  return 'error' in result ? null : result
}

/**
 * Keeps the app state in sync with the server. Local changes are pushed shortly
 * after they happen; the server is checked when the app opens, comes back to the
 * foreground, reconnects, and every minute while visible. Everything keeps working
 * offline: unsynced changes stay on the device until the server can be reached.
 */
export function useSync(state: AppState | null, applyState: (next: AppState) => void): SyncControls {
  const [status, setStatus] = useState<SyncStatus>(() => {
    const meta = loadMeta()
    return { connected: !!meta, phase: 'idle', lastSyncedAt: meta?.lastSyncedAt }
  })

  const stateRef = useRef(state)
  stateRef.current = state
  const running = useRef(false)
  const rerun = useRef(false)

  const run = useCallback(async () => {
    if (!loadMeta()) return
    if (running.current) {
      rerun.current = true
      return
    }
    running.current = true
    setStatus(s => ({ ...s, phase: 'syncing', error: undefined }))

    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const meta = loadMeta()
        if (!meta) return
        const local = stateRef.current
        const localJson = local ? exportData(local) : null
        const baseJson = loadBase()
        const dirty = local !== null && localJson !== baseJson

        const remote = await fetchRemote(meta.token)
        const remoteJson = remote.state ? exportData(remote.state) : null

        // The user changed something while we were waiting on the network: start over.
        const current = stateRef.current
        if ((current ? exportData(current) : null) !== localJson) continue

        if (!dirty) {
          if (remote.state && remoteJson !== localJson) applyState(remote.state)
          saveBase(remoteJson ?? baseJson)
          finish(meta, remote.revision)
          return
        }

        // Unsynced local changes. If the server moved on too, merge the two.
        let candidate = local!
        if (remote.revision !== meta.revision && remote.state) {
          candidate = mergeStates(parse(baseJson), local!, remote.state)
          if (exportData(candidate) !== localJson) applyState(candidate)
        }

        const result = await pushRemote(meta.token, remote.revision, candidate)
        if (!result.ok) continue // someone saved in between; fetch and try again

        saveBase(exportData(candidate))
        finish(meta, result.revision)
        return
      }
      throw new SyncError('server', 'Kept clashing with another device. Will retry shortly.')
    } catch (e) {
      const err = e instanceof SyncError ? e : new SyncError('server', String(e))
      if (err.kind === 'auth') {
        saveMeta(null)
        saveBase(null)
        setStatus({ connected: false, phase: 'error', error: err.message })
      } else {
        setStatus(s => ({ ...s, phase: 'error', error: err.message }))
      }
    } finally {
      running.current = false
      if (rerun.current) {
        rerun.current = false
        void run()
      }
    }

    function finish(meta: SyncMeta, revision: number) {
      const lastSyncedAt = new Date().toISOString()
      saveMeta({ ...meta, revision, lastSyncedAt })
      setStatus({ connected: true, phase: 'idle', lastSyncedAt })
    }
  }, [applyState])

  // Push local changes shortly after they happen.
  const stateJson = state ? exportData(state) : null
  useEffect(() => {
    if (!loadMeta() || stateJson === loadBase()) return
    const t = setTimeout(() => void run(), PUSH_DELAY_MS)
    return () => clearTimeout(t)
  }, [stateJson, run])

  // Check the server on open, on return to the app, on reconnect, and periodically.
  useEffect(() => {
    void run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run()
    }
    const onOnline = () => void run()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') void run()
    }, POLL_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      clearInterval(poll)
    }
  }, [run])

  const connect = useCallback(
    async (passcode: string) => {
      const token = await login(passcode, guessDeviceName())
      // No base yet: the first sync merges whatever is on this device with the server.
      saveBase(null)
      saveMeta({ token, revision: -1 })
      setStatus({ connected: true, phase: 'idle' })
      await run()
    },
    [run],
  )

  const disconnect = useCallback(() => {
    saveMeta(null)
    saveBase(null)
    setStatus({ connected: false, phase: 'idle' })
  }, [])

  const syncNow = useCallback(() => void run(), [run])

  return { ...status, connect, disconnect, syncNow }
}
