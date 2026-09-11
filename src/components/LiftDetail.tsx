import { useState } from 'react'
import type { AppState, LiftId } from '../model/types'
import { LIFT_DISPLAY_NAMES, MAX_FAILURES_BEFORE_DELOAD } from '../model/defaults'
import { getLiftRecords, getRepSchemeForLift, type LiftRecord } from '../model/programme'
import { formatDate } from '../model/dates'
import StatusBadge from '../ui/StatusBadge'
import LiftChart, { type ChartMetric, type ChartRange } from './LiftChart'

interface LiftDetailProps {
  liftId: LiftId
  state: AppState
  onBack: () => void
}

const METRICS: { id: ChartMetric; label: string }[] = [
  { id: 'weight', label: 'Weight' },
  { id: 'e1rm', label: 'Est. 1RM' },
]

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function RecordRow({ label, record, units }: { label: string; record: LiftRecord | null; units: string }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-gray-100">{label}</div>
        <div className="text-xs text-gray-500">{record ? formatDate(record.date) : 'No sessions yet'}</div>
      </div>
      <div className="font-mono font-bold text-gray-100 whitespace-nowrap">
        {record ? `${formatNumber(record.value)} ${units}` : '—'}
      </div>
    </div>
  )
}

export default function LiftDetail({ liftId, state, onBack }: LiftDetailProps) {
  const [range, setRange] = useState<ChartRange>('30')
  const [metric, setMetric] = useState<ChartMetric>('weight')

  const lift = state.lifts[liftId]
  const units = state.units
  const records = getLiftRecords(state.workouts, liftId)
  const scheme = getRepSchemeForLift(liftId, lift).replace('x', '×')
  const successRate = records.sessions > 0
    ? Math.round((records.completedSessions / records.sessions) * 100)
    : null

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="text-gray-400 hover:text-gray-200 p-1 -ml-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-100">{LIFT_DISPLAY_NAMES[liftId]}</h1>
      </div>

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Current Weight</h2>
          <StatusBadge status={lift.status} failureCount={lift.failureCount} />
        </div>
        <div className="font-mono text-gray-50">
          <span className="text-4xl font-bold">{lift.currentWeight}</span>
          <span className="text-lg text-gray-400 ml-1">{units}</span>
        </div>
        <p className="text-sm text-gray-400">
          {scheme} · complete it to move up to {lift.currentWeight + state.increments[liftId]} {units}
        </p>
        {lift.failureCount > 0 && (
          <p className="text-sm text-amber-400">
            Missed {lift.failureCount}× in a row at this weight. {MAX_FAILURES_BEFORE_DELOAD} misses in a row
            triggers a 10% deload.
          </p>
        )}
      </section>

      <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Personal Records
        </h2>
        <div className="divide-y divide-gray-800">
          <RecordRow label="Heaviest completed" record={records.heaviest} units={units} />
          <RecordRow label="Best estimated 1RM" record={records.bestE1RM} units={units} />
          <RecordRow label="Most volume in a session" record={records.bestVolume} units={units} />
        </div>
        {successRate !== null && (
          <p className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
            {records.sessions} session{records.sessions === 1 ? '' : 's'} · {successRate}% completed
          </p>
        )}
      </section>

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {METRICS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetric(m.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  metric === m.id ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(['10', '30', 'all'] as ChartRange[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  range === r ? 'bg-[#1a4a16]/50 text-[#47c23f]' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>
        <LiftChart liftId={liftId} workouts={state.workouts} units={units} range={range} metric={metric} />
      </section>
    </div>
  )
}
