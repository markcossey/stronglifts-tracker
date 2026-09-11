import { useEffect, useRef } from 'react'

const SCALE_IN_MS = 1000
const HOLD_MS = 150
const FADE_MS = 500

// Each step starts when the previous one finishes, so a busy main thread at launch delays the
// sequence rather than cutting the fade short, and the scale-in waits for the first painted frame.
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current!
    const logo = logoRef.current!
    const animations: Animation[] = []
    let cancelled = false

    const frame = requestAnimationFrame(() => requestAnimationFrame(async () => {
      if (cancelled) return
      try {
        const scaleIn = logo.animate(
          [{ transform: 'scale(0.85)' }, { transform: 'scale(1)' }],
          { duration: SCALE_IN_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
        )
        animations.push(scaleIn)
        await scaleIn.finished

        const fade = overlay.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: FADE_MS, delay: HOLD_MS, easing: 'ease-out', fill: 'forwards' },
        )
        animations.push(fade)
        await fade.finished

        if (!cancelled) onDone()
      } catch {
        // Animations are cancelled on unmount
      }
    }))

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      animations.forEach(a => a.cancel())
    }
  }, [onDone])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{ willChange: 'opacity' }}
    >
      <svg
        ref={logoRef}
        viewBox="0 0 100 100"
        className="w-48 h-48"
        fill="none"
        stroke="white"
        strokeWidth={3.5}
        strokeLinejoin="round"
        style={{ transform: 'scale(0.85)', willChange: 'transform' }}
      >
        <polygon points="50,13.4 93.3,88.4 6.7,88.4" />
      </svg>
    </div>
  )
}
