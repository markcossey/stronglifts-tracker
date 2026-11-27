import type { AppState } from '../model/types'

const API_BASE = `${import.meta.env.BASE_URL}api`

export type SyncErrorKind = 'auth' | 'wrong_passcode' | 'locked' | 'offline' | 'not_configured' | 'server'

export class SyncError extends Error {
  constructor(public kind: SyncErrorKind, message: string) {
    super(message)
  }
}

export interface RemoteState {
  revision: number
  state: AppState | null
  updatedAt?: string
  device?: string
}

async function request(path: string, init: RequestInit & { token?: string } = {}): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (init.body) headers['Content-Type'] = 'application/json'
  if (init.token) headers['X-Auth-Token'] = init.token
  let res: Response
  try {
    res = await fetch(`${API_BASE}/${path}`, { ...init, headers, cache: 'no-store' })
  } catch {
    throw new SyncError('offline', "Can't reach the server. Changes will sync when you're back online.")
  }
  if (res.status === 503) throw new SyncError('not_configured', 'Sync has not been set up on the server yet.')
  return res
}

export async function login(passcode: string, device: string): Promise<string> {
  const res = await request('login.php', { method: 'POST', body: JSON.stringify({ passcode, device }) })
  if (res.status === 401) throw new SyncError('wrong_passcode', "That passcode isn't right.")
  if (res.status === 429) throw new SyncError('locked', 'Too many wrong attempts. Try again in 15 minutes.')
  if (!res.ok) throw new SyncError('server', `Server error (${res.status}).`)
  const data = await res.json()
  return data.token as string
}

export async function fetchRemote(token: string): Promise<RemoteState> {
  const res = await request('state.php', { token })
  if (res.status === 401) throw new SyncError('auth', 'This device is no longer connected. Enter your passcode again.')
  if (!res.ok) throw new SyncError('server', `Server error (${res.status}).`)
  return res.json()
}

export type PushResult = { ok: true; revision: number } | { ok: false; conflict: true }

export async function pushRemote(token: string, baseRevision: number, state: AppState): Promise<PushResult> {
  const res = await request('state.php', {
    method: 'POST',
    token,
    body: JSON.stringify({ baseRevision, state }),
  })
  if (res.status === 409) return { ok: false, conflict: true }
  if (res.status === 401) throw new SyncError('auth', 'This device is no longer connected. Enter your passcode again.')
  if (!res.ok) throw new SyncError('server', `Server error (${res.status}).`)
  const data = await res.json()
  return { ok: true, revision: data.revision as number }
}

/** A short readable name for this device, shown in the server's records. */
export function guessDeviceName(): string {
  const ua = navigator.userAgent
  if (/iPad|Macintosh.*Mobile|Macintosh.*Touch/.test(ua) && navigator.maxTouchPoints > 1) return 'iPad'
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/Android/.test(ua)) return 'Android'
  if (/Mac/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  return 'Browser'
}
