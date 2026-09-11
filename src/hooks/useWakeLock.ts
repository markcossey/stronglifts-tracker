import { useEffect } from 'react'

// The browser drops the lock whenever the app is hidden, so it is re-requested when the app
// becomes visible again, and on taps in case the browser insists on a user gesture.
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let pending = false
    let cancelled = false

    async function request() {
      if (cancelled || sentinel || pending || document.visibilityState !== 'visible') return
      pending = true
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel = lock
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null
        })
      } catch {
        // Refused, e.g. in iOS Low Power Mode; retried on the next tap or return to the app
      } finally {
        pending = false
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('pointerdown', request)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('pointerdown', request)
      void sentinel?.release()
    }
  }, [])
}
