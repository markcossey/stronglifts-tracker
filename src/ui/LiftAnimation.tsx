import { useEffect, useState } from 'react'
import type { LiftId } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'

// Illustrations by Everkinetic (CC BY-SA 4.0), unmodified, in public/lifts
const FRAME_SLUGS: Record<LiftId, string> = {
  squat: 'squat',
  bench: 'bench-press',
  row: 'barbell-row',
  ohp: 'overhead-press',
  deadlift: 'deadlift',
}

const FRAMES = [1, 2, 3]
// Start → middle → end → middle, so the loop reads as one rep rather than snapping back
const SEQUENCE = [1, 2, 3, 2]
const FRAME_MS = 650

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export default function LiftAnimation({ liftId, className = '' }: { liftId: LiftId; className?: string }) {
  const reduced = usePrefersReducedMotion()
  const [step, setStep] = useState(0)
  const slug = FRAME_SLUGS[liftId]

  useEffect(() => {
    if (reduced) return
    const interval = setInterval(() => setStep(current => (current + 1) % SEQUENCE.length), FRAME_MS)
    return () => clearInterval(interval)
  }, [reduced])

  const activeFrame = reduced ? 1 : SEQUENCE[step]

  return (
    <div
      role="img"
      aria-label={`Animation of the ${LIFT_DISPLAY_NAMES[liftId]}`}
      className={`relative ${className}`}
    >
      {FRAMES.map(frame => (
        <img
          key={frame}
          src={`${import.meta.env.BASE_URL}lifts/${slug}-${frame}.svg`}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
            frame === activeFrame ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  )
}
