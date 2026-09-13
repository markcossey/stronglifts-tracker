import { useState } from 'react'
import type { AppState, BodyWeightEntry, BodyWeightUnits } from '../model/types'
import { formatDate } from '../model/dates'
import {
  bodyWeightParts,
  formatWeightChange,
  getBodyWeightChange,
  numericUnits,
  shownBodyWeights,
  toShownWeight,
} from '../model/bodyWeight'
import BodyWeightDialog from './BodyWeightDialog'

interface BodyWeightCardProps {
  state: AppState
  onOpen: () => void
  onSave: (entry: BodyWeightEntry, previousDate: string | undefined, bodyWeightUnits: BodyWeightUnits) => void
}

export default function BodyWeightCard({ state, onOpen, onSave }: BodyWeightCardProps) {
  const [logging, setLogging] = useState(false)
  const shown = state.bodyWeightUnits ?? state.units
  const entries = state.bodyWeights ?? []
  const latest = entries[entries.length - 1]
  const change = getBodyWeightChange(shownBodyWeights(entries, state.units, shown), 30)
  const latestParts = latest ? bodyWeightParts(toShownWeight(latest.weight, state.units, shown), shown) : []

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 flex items-stretch overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex-1 min-w-0 text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-800/50 active:bg-gray-800 transition-colors"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Body Weight</div>
          {latest ? (
            <>
              <div className="mt-1 font-mono text-gray-100">
                {latestParts.map(part => (
                  <span key={part.unit} className="mr-1.5 last:mr-0">
                    <span className="text-xl font-bold">{part.value}</span>
                    <span className="text-sm text-gray-400 ml-1">{part.unit}</span>
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(latest.date)}
                {change && ` · ${formatWeightChange(change.change, numericUnits(shown))} since ${formatDate(change.since)}`}
              </div>
            </>
          ) : (
            <div className="mt-1 text-sm text-gray-500">No weigh-ins yet</div>
          )}
        </div>
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setLogging(true)}
        className="px-5 border-l border-gray-800 text-sm font-semibold text-[#47c23f] hover:bg-gray-800/50 active:bg-gray-800 transition-colors"
      >
        Log
      </button>
      {logging && (
        <BodyWeightDialog
          units={state.units}
          bodyWeightUnits={shown}
          suggestedWeight={latest?.weight}
          onSave={onSave}
          onClose={() => setLogging(false)}
        />
      )}
    </div>
  )
}
