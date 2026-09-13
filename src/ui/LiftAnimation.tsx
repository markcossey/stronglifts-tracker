import { useEffect, useState } from 'react'
import type { LiftId } from '../model/types'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'

interface Pose {
  body: string
  farLeg: string
  arm: string
  head: [number, number]
  bar: [number, number]
}

interface LiftAnimationSpec {
  poses: [Pose, Pose]
  duration: number
  prop: 'floor' | 'bench'
}

// Side-on figure. `body` runs toe → ankle → knee → hip → shoulder and `farLeg` is the leg further
// from the viewer, drawn darker behind it so the figure reads as a person rather than a line.
// The two poses are the ends of the movement; joints stay offset when standing so it never
// collapses to a straight post.
const STANDING_BODY = 'M68,110 L58,110 L62,84 L54,58 L58,34'
const STANDING_FAR_LEG = 'M60,110 L50,110 L54,84 L54,58'

const SPECS: Record<LiftId, LiftAnimationSpec> = {
  squat: {
    duration: 3,
    prop: 'floor',
    poses: [
      {
        body: STANDING_BODY,
        farLeg: STANDING_FAR_LEG,
        arm: 'M58,34 L50,42 L52,36',
        head: [64, 23],
        bar: [52, 35],
      },
      {
        body: 'M68,110 L58,110 L70,86 L46,72 L52,48',
        farLeg: 'M60,110 L50,110 L62,86 L46,72',
        arm: 'M52,48 L44,54 L48,49',
        head: [60, 37],
        bar: [48, 49],
      },
    ],
  },
  bench: {
    duration: 3,
    prop: 'bench',
    poses: [
      {
        body: 'M98,110 L88,90 L78,72 L48,70',
        farLeg: 'M92,110 L82,92 L78,72',
        arm: 'M48,70 L40,62 L49,58',
        head: [38, 68],
        bar: [49, 58],
      },
      {
        body: 'M98,110 L88,90 L78,72 L48,70',
        farLeg: 'M92,110 L82,92 L78,72',
        arm: 'M48,70 L48,50 L49,38',
        head: [38, 68],
        bar: [49, 38],
      },
    ],
  },
  row: {
    duration: 2.6,
    prop: 'floor',
    poses: [
      {
        body: 'M72,110 L62,110 L64,86 L64,66 L42,56',
        farLeg: 'M64,110 L54,110 L56,86 L64,66',
        arm: 'M42,56 L40,78 L39,98',
        head: [32, 52],
        bar: [39, 100],
      },
      {
        body: 'M72,110 L62,110 L64,86 L64,66 L42,56',
        farLeg: 'M64,110 L54,110 L56,86 L64,66',
        arm: 'M42,56 L48,66 L41,72',
        head: [32, 52],
        bar: [40, 72],
      },
    ],
  },
  ohp: {
    duration: 3,
    prop: 'floor',
    poses: [
      {
        body: STANDING_BODY,
        farLeg: STANDING_FAR_LEG,
        arm: 'M58,34 L48,44 L50,38',
        head: [66, 23],
        bar: [50, 37],
      },
      {
        body: STANDING_BODY,
        farLeg: STANDING_FAR_LEG,
        arm: 'M58,34 L58,20 L58,12',
        head: [62, 23],
        bar: [58, 10],
      },
    ],
  },
  deadlift: {
    duration: 3.4,
    prop: 'floor',
    poses: [
      {
        body: 'M68,110 L58,110 L68,86 L46,72 L52,50',
        farLeg: 'M60,110 L50,110 L60,86 L46,72',
        arm: 'M52,50 L54,76 L56,98',
        head: [58, 40],
        bar: [56, 100],
      },
      {
        body: STANDING_BODY,
        farLeg: STANDING_FAR_LEG,
        arm: 'M58,34 L62,52 L66,72',
        head: [64, 23],
        bar: [66, 72],
      },
    ],
  },
}

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
  const spec = SPECS[liftId]
  const [start, end] = spec.poses
  const timing = {
    dur: `${spec.duration}s`,
    repeatCount: 'indefinite',
    calcMode: 'spline',
    keyTimes: '0;0.5;1',
    keySplines: '0.4 0 0.2 1;0.4 0 0.2 1',
  } as const

  function loop(attributeName: string, from: number | string, to: number | string) {
    if (reduced) return null
    return <animate attributeName={attributeName} values={`${from};${to};${from}`} {...timing} />
  }

  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Animation of the ${LIFT_DISPLAY_NAMES[liftId]}`}
      className={className}
    >
      {spec.prop === 'bench' ? (
        <g stroke="#374151" strokeLinecap="round">
          <line x1={26} y1={74} x2={104} y2={74} strokeWidth={7} />
          <line x1={38} y1={78} x2={38} y2={110} strokeWidth={4} />
          <line x1={92} y1={78} x2={92} y2={110} strokeWidth={4} />
          <line x1={10} y1={110} x2={110} y2={110} strokeWidth={2} />
        </g>
      ) : (
        <line x1={10} y1={110} x2={110} y2={110} stroke="#374151" strokeWidth={2} strokeLinecap="round" />
      )}

      <path d={start.farLeg} fill="none" stroke="#6b7280" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round">
        {loop('d', start.farLeg, end.farLeg)}
      </path>
      <path d={start.body} fill="none" stroke="#9ca3af" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        {loop('d', start.body, end.body)}
      </path>
      <path d={start.arm} fill="none" stroke="#9ca3af" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round">
        {loop('d', start.arm, end.arm)}
      </path>
      <circle cx={start.head[0]} cy={start.head[1]} r={8} fill="#9ca3af">
        {loop('cx', start.head[0], end.head[0])}
        {loop('cy', start.head[1], end.head[1])}
      </circle>

      <g transform={`translate(${start.bar[0]} ${start.bar[1]})`}>
        {!reduced && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`${start.bar[0]} ${start.bar[1]};${end.bar[0]} ${end.bar[1]};${start.bar[0]} ${start.bar[1]}`}
            {...timing}
          />
        )}
        <line x1={-18} y1={0} x2={18} y2={0} stroke="#e5e7eb" strokeWidth={3.5} strokeLinecap="round" />
        <circle r={8} fill="#47c23f" stroke="#111827" strokeWidth={1.5} />
      </g>
    </svg>
  )
}
