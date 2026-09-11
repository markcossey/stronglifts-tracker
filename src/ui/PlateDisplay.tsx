import type { Units } from '../model/types'
import { calculatePlates } from '../model/programme'

interface PlateDisplayProps {
  weight: number
  units: Units
  onClose: () => void
}

const PLATE_COLORS_KG: Record<number, string> = {
  25: '#27272a',
  20: '#3b82f6',
  10: '#22c55e',
  5: '#f8fafc',
  2.5: '#eab308',
  1.25: '#27272a',
  0.5: '#f8fafc',
}

const PLATE_COLORS_LB: Record<number, string> = {
  45: '#3b82f6',
  35: '#eab308',
  25: '#22c55e',
  10: '#f8fafc',
  5: '#ef4444',
  2.5: '#9ca3af',
}

function getPlateColor(weight: number, units: Units): string {
  const colors = units === 'kg' ? PLATE_COLORS_KG : PLATE_COLORS_LB
  return colors[weight] ?? '#6b7280'
}

function getPlateHeight(weight: number, units: Units): number {
  if (units === 'kg') {
    if (weight >= 20) return 155
    if (weight >= 10) return 120
    if (weight >= 5) return 96
    if (weight >= 2.5) return 78
    if (weight >= 1.25) return 64
    return 50
  }
  if (weight >= 45) return 155
  if (weight >= 35) return 136
  if (weight >= 25) return 120
  if (weight >= 10) return 95
  if (weight >= 5) return 78
  return 60
}

function getPlateWidth(weight: number, units: Units): number {
  if (units === 'kg') {
    if (weight >= 10) return 30
    if (weight >= 5) return 21
    if (weight >= 1.25) return 14
    return 11
  }
  if (weight >= 25) return 30
  if (weight >= 10) return 21
  return 14
}

const FONT_SIZE_HORIZONTAL = 16
const FONT_SIZE_VERTICAL = 14

function getPlateLabelLines(weight: number, plateWidth: number): { lines: string[]; fontSize: number; horizontal: boolean } {
  const label = String(weight)
  const estimatedHorizontalWidth = label.length * FONT_SIZE_HORIZONTAL * 0.62
  if (estimatedHorizontalWidth <= plateWidth - 4) {
    return { lines: [label], fontSize: FONT_SIZE_HORIZONTAL, horizontal: true }
  }
  return { lines: label.split(''), fontSize: FONT_SIZE_VERTICAL, horizontal: false }
}

export default function PlateDisplay({ weight, units, onClose }: PlateDisplayProps) {
  const result = calculatePlates(weight, units)

  const allPlates: { weight: number }[] = []
  for (const { weight: pw, count } of result.perSide) {
    for (let i = 0; i < count; i++) {
      allPlates.push({ weight: pw })
    }
  }

  const barStartX = 20
  const barEndX = 100
  const barY = 85
  const barHeight = 14
  const collarWidth = 18
  const plateGap = 4
  const sleeveStartX = barEndX

  let totalPlateWidth = 0
  for (const plate of allPlates) {
    totalPlateWidth += getPlateWidth(plate.weight, units) + plateGap
  }

  const svgWidth = sleeveStartX + collarWidth + totalPlateWidth + 50
  const svgHeight = 190

  let plateX = sleeveStartX + collarWidth + 2

  return (
    <button
      type="button"
      onClick={onClose}
      className="w-full bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">
          {weight} {units} — plate setup (per side)
        </span>
        <span className="text-xs text-gray-600">tap to close</span>
      </div>

      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full"
          style={{ maxHeight: '220px' }}
        >
          {/* Bar shaft */}
          <rect
            x={barStartX}
            y={barY - barHeight / 2}
            width={barEndX - barStartX}
            height={barHeight}
            rx={2}
            fill="#71717a"
          />

          {/* Sleeve (thicker part) */}
          <rect
            x={barEndX}
            y={barY - 11}
            width={collarWidth + totalPlateWidth + 20}
            height={22}
            rx={2}
            fill="#52525b"
          />

          {/* Collar */}
          <rect
            x={sleeveStartX}
            y={barY - 18}
            width={collarWidth}
            height={36}
            rx={2}
            fill="#a1a1aa"
          />

          {/* Plates */}
          {allPlates.map((plate, i) => {
            const pw = getPlateWidth(plate.weight, units)
            const ph = getPlateHeight(plate.weight, units)
            const color = getPlateColor(plate.weight, units)
            const x = plateX
            plateX += pw + plateGap

            const isWhite = color === '#f8fafc'
            const isDark = color === '#27272a'
            const needsBorder = isWhite || isDark
            const borderColor = isWhite ? '#94a3b8' : '#52525b'
            const textFill = isWhite ? '#1e293b' : isDark ? '#a1a1aa' : '#000000'

            const { lines, fontSize, horizontal } = getPlateLabelLines(plate.weight, pw)
            const lineHeight = fontSize * 1.05
            const startY = barY - ((lines.length - 1) * lineHeight) / 2

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={barY - ph / 2}
                  width={pw}
                  height={ph}
                  rx={2}
                  fill={color}
                  stroke={needsBorder ? borderColor : 'none'}
                  strokeWidth={needsBorder ? 1 : 0}
                />
                <text
                  x={x + pw / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize}
                  fontWeight="bold"
                  fill={textFill}
                  opacity={0.85}
                >
                  {horizontal ? (
                    <tspan y={barY}>{lines[0]}</tspan>
                  ) : (
                    lines.map((line, li) => (
                      <tspan key={li} x={x + pw / 2} y={startY + li * lineHeight}>
                        {line}
                      </tspan>
                    ))
                  )}
                </text>
              </g>
            )
          })}

          {/* End cap */}
          <rect
            x={plateX + 2}
            y={barY - 14}
            width={11}
            height={28}
            rx={2}
            fill="#a1a1aa"
          />
        </svg>
      </div>

      {result.isBarOnly ? (
        <div className="text-center text-sm text-gray-400">
          Bar only ({result.barWeight} {units})
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {result.perSide.map(({ weight: pw, count }) => (
            <span key={pw} className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
              {count}× {pw} {units}
            </span>
          ))}
        </div>
      )}

      {Math.abs(result.loadedWeight - weight) > 1e-6 && (
        <div className="text-xs text-amber-400">
          Can't load {weight} {units} exactly with standard plates. This setup loads {result.loadedWeight} {units}.
        </div>
      )}
    </button>
  )
}
