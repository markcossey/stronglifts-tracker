import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import type { LiftId, Workout } from '../model/types'
import { getLiftHistory } from '../model/programme'
import { LIFT_DISPLAY_NAMES } from '../model/defaults'

interface LiftChartProps {
  liftId: LiftId
  workouts: Workout[]
  units: string
  range: '10' | '30' | 'all'
}

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: { completed: boolean }
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={payload.completed ? '#4ade80' : '#f87171'}
      stroke="#111827"
      strokeWidth={2}
    />
  )
}

export default function LiftChart({ liftId, workouts, units, range }: LiftChartProps) {
  let history = getLiftHistory(workouts, liftId)

  if (range === '10') history = history.slice(-10)
  else if (range === '30') history = history.slice(-30)

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No data for {LIFT_DISPLAY_NAMES[liftId]} yet
      </div>
    )
  }

  const data = history.map(h => ({
    date: new Date(h.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: h.weight,
    completed: h.completed,
  }))

  const pr = Math.max(...history.filter(h => h.completed).map(h => h.weight), 0)
  const weights = history.map(h => h.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const padding = Math.max((maxWeight - minWeight) * 0.1, 5)

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis
            domain={[minWeight - padding, maxWeight + padding]}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
            unit={` ${units}`}
          />
          <Tooltip
            formatter={(value: number) => [`${value} ${units}`, 'Weight']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #374151',
              fontSize: '12px',
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
            }}
          />
          {pr > 0 && (
            <ReferenceLine
              y={pr}
              stroke="#4ade80"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `PR: ${pr}`, position: 'right', fontSize: 10, fill: '#4ade80' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#47c23f"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: '#47c23f', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
