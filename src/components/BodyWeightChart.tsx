import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { BodyWeightEntry, BodyWeightUnits } from '../model/types'
import { formatDate, localDateString } from '../model/dates'
import { formatBodyWeight, splitStones } from '../model/bodyWeight'

export type BodyWeightRange = '30' | '90' | '365' | 'all'

// `entries` are in the shown units (pounds for stone).
interface BodyWeightChartProps {
  entries: BodyWeightEntry[]
  units: BodyWeightUnits
  range: BodyWeightRange
}

// Stone ticks land on whole-pound steps that keep the labels readable, e.g. "13st 7".
function stoneTicks(min: number, max: number): number[] {
  const step = [1, 2, 7, 14, 28].find(s => (max - min) / s <= 5) ?? 56
  const ticks = []
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(t)
  return ticks
}

function formatStoneTick(pounds: number): string {
  const { stones, pounds: remainder } = splitStones(pounds)
  return remainder === 0 ? `${stones}st` : `${stones}st ${remainder}`
}

function formatTimestamp(time: number): string {
  return formatDate(localDateString(new Date(time)))
}

export default function BodyWeightChart({ entries, units, range }: BodyWeightChartProps) {
  let visible = entries
  if (range !== 'all' && entries.length > 0) {
    const cutoff = new Date(entries[entries.length - 1].date + 'T00:00:00')
    cutoff.setDate(cutoff.getDate() - Number(range))
    const cutoffDate = localDateString(cutoff)
    visible = entries.filter(e => e.date >= cutoffDate)
  }

  if (visible.length === 0) {
    return <div className="text-center py-8 text-gray-500 text-sm">No weigh-ins in this period</div>
  }

  const data = visible.map(e => ({ time: new Date(e.date + 'T00:00:00').getTime(), weight: e.weight }))
  const weights = data.map(d => d.weight)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const padding = Math.max((max - min) * 0.15, 1)
  const domain = [Math.floor(min - padding), Math.ceil(max + padding)]
  const stone = units === 'st'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatTimestamp}
          minTickGap={16}
          tick={{ fontSize: 10, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#374151' }}
        />
        <YAxis
          domain={domain}
          ticks={stone ? stoneTicks(domain[0], domain[1]) : undefined}
          tickFormatter={stone ? formatStoneTick : undefined}
          width={stone ? 68 : 60}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#374151' }}
          unit={stone ? undefined : ` ${units}`}
        />
        <Tooltip
          labelFormatter={formatTimestamp}
          formatter={(value: number) => [formatBodyWeight(value, units), 'Body weight']}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #374151',
            fontSize: '12px',
            backgroundColor: '#1f2937',
            color: '#f3f4f6',
          }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={data.length <= 40 ? { r: 3, fill: '#60a5fa', stroke: '#111827', strokeWidth: 1 } : false}
          activeDot={{ r: 5, stroke: '#60a5fa', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
