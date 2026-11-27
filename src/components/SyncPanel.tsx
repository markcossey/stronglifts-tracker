import { useState, type FormEvent } from 'react'
import type { SyncControls } from '../hooks/useSync'
import { SyncError } from '../sync/api'
import Button from '../ui/Button'

/** Passcode form used both in Settings and on the welcome screen. */
export function SyncConnectForm({ sync, submitLabel = 'Connect' }: { sync: SyncControls; submitLabel?: string }) {
  const [passcode, setPasscode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!passcode || busy) return
    setBusy(true)
    setError(null)
    try {
      await sync.connect(passcode)
      setPasscode('')
    } catch (err) {
      setError(err instanceof SyncError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm text-gray-300" htmlFor="sync-passcode">
        Sync passcode
      </label>
      <input
        id="sync-passcode"
        type="password"
        autoComplete="current-password"
        value={passcode}
        onChange={e => setPasscode(e.target.value)}
        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:border-[#47c23f] outline-none"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" fullWidth disabled={!passcode || busy}>
        {busy ? 'Connecting…' : submitLabel}
      </Button>
    </form>
  )
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  return new Date(iso).toLocaleDateString()
}

export default function SyncPanel({ sync }: { sync: SyncControls }) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
      <h3 className="font-semibold text-gray-100">Sync</h3>
      {!sync.connected ? (
        <>
          <p className="text-xs text-gray-500">
            Keep your workouts the same on all your devices. Enter your passcode once on each device.
          </p>
          {sync.error && <p className="text-sm text-amber-400">{sync.error}</p>}
          <SyncConnectForm sync={sync} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm" aria-live="polite">
            <span
              className={`w-2 h-2 rounded-full ${
                sync.phase === 'error' ? 'bg-amber-400' : sync.phase === 'syncing' ? 'bg-gray-400 animate-pulse' : 'bg-[#47c23f]'
              }`}
            />
            <span className="text-gray-300">
              {sync.phase === 'syncing'
                ? 'Syncing…'
                : sync.phase === 'error'
                  ? 'Not synced'
                  : sync.lastSyncedAt
                    ? `Synced ${timeAgo(sync.lastSyncedAt)}`
                    : 'Connected'}
            </span>
          </div>
          {sync.phase === 'error' && sync.error && <p className="text-xs text-amber-400">{sync.error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={sync.syncNow} disabled={sync.phase === 'syncing'}>
              Sync now
            </Button>
            {confirmDisconnect ? (
              <Button
                variant="danger"
                onClick={() => {
                  sync.disconnect()
                  setConfirmDisconnect(false)
                }}
              >
                Confirm
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmDisconnect(true)}>
                Disconnect
              </Button>
            )}
          </div>
          {confirmDisconnect && (
            <p className="text-xs text-gray-500">
              This device stops syncing. Your data stays here and on the server.
            </p>
          )}
        </>
      )}
    </section>
  )
}
