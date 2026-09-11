import { useState } from 'react'
import type { AppState, BodyWeightEntry } from '../model/types'
import { formatDate } from '../model/dates'
import { formatWeightChange, getBodyWeightChange } from '../model/bodyWeight'
import BodyWeightDialog from './BodyWeightDialog'

interface BodyWeightCardProps {
  state: AppState
  onOpen: () => void
  onSave: (entry: BodyWeightEntry, previousDate?: string) => void
}

export default function BodyWeightCard({ state, onOpen, onSave }: BodyWeightCardProps) {
  const [logging, setLogging] = useState(false)
  const entries = state.bodyWeights ?? []
  const latest = entries[entries.length - 1]
  const change = getBodyWeightChange(entries, 30)

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
                <span className="text-xl font-bold">{latest.weight}</span>
                <span className="text-sm text-gray-400 ml-1">{state.units}</span>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(latest.date)}
                {change && ` · ${formatWeightChange(change.change, state.units)} since ${formatDate(change.since)}`}
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
          suggestedWeight={latest?.weight}
          onSave={onSave}
          onClose={() => setLogging(false)}
        />
      )}
    </div>
  )
}
