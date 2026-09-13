import { useState } from 'react'
import type { AppState, BodyWeightEntry, BodyWeightUnits } from '../model/types'
import { formatDate } from '../model/dates'
import {
  bodyWeightParts,
  formatBodyWeight,
  formatWeightChange,
  getBodyWeightChange,
  numericUnits,
  shownBodyWeights,
} from '../model/bodyWeight'
import Button from '../ui/Button'
import BodyWeightChart, { type BodyWeightRange } from './BodyWeightChart'
import BodyWeightDialog from './BodyWeightDialog'

interface BodyWeightDetailProps {
  state: AppState
  onSave: (entry: BodyWeightEntry, previousDate: string | undefined, bodyWeightUnits: BodyWeightUnits) => void
  onDelete: (date: string) => void
  onBack: () => void
}

const RANGES: { id: BodyWeightRange; label: string }[] = [
  { id: '30', label: '30D' },
  { id: '90', label: '90D' },
  { id: '365', label: '1Y' },
  { id: 'all', label: 'All' },
]

const INITIAL_ROWS = 20

export default function BodyWeightDetail({ state, onSave, onDelete, onBack }: BodyWeightDetailProps) {
  const [range, setRange] = useState<BodyWeightRange>('90')
  const [dialog, setDialog] = useState<{ entry?: BodyWeightEntry } | null>(null)
  const [showAll, setShowAll] = useState(false)

  const units = state.units
  const shown = state.bodyWeightUnits ?? units
  const changeUnits = numericUnits(shown)
  const entries = state.bodyWeights ?? []
  const shownEntries = shownBodyWeights(entries, units, shown)
  const latest = entries[entries.length - 1]
  const shownLatest = shownEntries[shownEntries.length - 1]
  const change = getBodyWeightChange(shownEntries, 30)
  const newestFirst = [...shownEntries].reverse()
  const rows = showAll ? newestFirst : newestFirst.slice(0, INITIAL_ROWS)

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Back" className="text-gray-400 hover:text-gray-200 p-1 -ml-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-100">Body Weight</h1>
      </div>

      <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Latest</h2>
        {shownLatest ? (
          <div>
            <div className="font-mono text-gray-50">
              {bodyWeightParts(shownLatest.weight, shown).map(part => (
                <span key={part.unit} className="mr-2 last:mr-0">
                  <span className="text-4xl font-bold">{part.value}</span>
                  <span className="text-lg text-gray-400 ml-1">{part.unit}</span>
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              {formatDate(shownLatest.date)}
              {change && ` · ${formatWeightChange(change.change, changeUnits)} since ${formatDate(change.since)}`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No weigh-ins yet. Log your first one to start tracking.</p>
        )}
        <Button fullWidth onClick={() => setDialog({})}>Log body weight</Button>
      </section>

      {entries.length > 0 && (
        <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Trend</h2>
            <div className="flex gap-1">
              {RANGES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    range === r.id ? 'bg-[#1a4a16]/50 text-[#47c23f]' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <BodyWeightChart entries={shownEntries} units={shown} range={range} />
        </section>
      )}

      {entries.length > 0 && (
        <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <h2 className="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Weigh-ins
          </h2>
          <div className="divide-y divide-gray-800">
            {rows.map((entry, i) => {
              const previous = newestFirst[i + 1]
              const diff = previous ? Math.round((entry.weight - previous.weight) * 10) / 10 : 0
              return (
                <button
                  key={entry.date}
                  type="button"
                  onClick={() => setDialog({ entry: entries.find(e => e.date === entry.date) })}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-800/50 active:bg-gray-800 transition-colors"
                >
                  <span className="text-sm text-gray-300">
                    {formatDate(entry.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="flex items-baseline gap-3">
                    {diff !== 0 && <span className="text-xs text-gray-500">{formatWeightChange(diff, changeUnits)}</span>}
                    <span className="font-mono font-bold text-gray-100 whitespace-nowrap">{formatBodyWeight(entry.weight, shown)}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {!showAll && newestFirst.length > INITIAL_ROWS && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full py-3 text-sm font-medium text-[#47c23f] border-t border-gray-800 hover:bg-gray-800/50"
            >
              Show all {newestFirst.length}
            </button>
          )}
        </section>
      )}

      {dialog && (
        <BodyWeightDialog
          units={units}
          bodyWeightUnits={shown}
          entry={dialog.entry}
          suggestedWeight={latest?.weight}
          onSave={onSave}
          onDelete={onDelete}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
