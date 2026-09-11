import type { LiftId, Workout } from '../model/types'
import { getLiftHistory } from '../model/programme'

interface SparklineProps {
  liftId: LiftId
  workouts: Workout[]
}

export default function Sparkline({ liftId, workouts }: SparklineProps) {
  const history = getLiftHistory(workouts, liftId).slice(-15)

  if (history.length < 2) return null

  const weights = history.map(h => h.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  const w = 64
  const h = 24
  const pad = 2

  const points = weights
    .map((wt, i) => {
      const x = pad + (i / (weights.length - 1)) * (w - pad * 2)
      const y = h - pad - ((wt - min) / range) * (h - pad * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke="#47c23f"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
