import type { AppState, LiftId } from '../model/types'
import { ALL_LIFTS, LIFT_DISPLAY_NAMES } from '../model/defaults'
import { getPersonalRecord, getWorkoutStats } from '../model/programme'
import { formatDate } from '../model/dates'

interface PRSectionProps {
  state: AppState
  onOpenLift: (liftId: LiftId) => void
}

export default function PRSection({ state, onOpenLift }: PRSectionProps) {
  const stats = getWorkoutStats(state.workouts)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-gray-100">{stats.total}</div>
          <div className="text-xs text-gray-500">Workouts</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.successful}</div>
          <div className="text-xs text-gray-500">Successful</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{stats.failed}</div>
          <div className="text-xs text-gray-500">With fails</div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Personal Records</h3>
        </div>
        <div className="divide-y divide-gray-800">
          {ALL_LIFTS.map(liftId => {
            const lift = state.lifts[liftId]
            const pr = getPersonalRecord(state.workouts, liftId)
            const prDate = pr ? formatDate(pr.date) : '—'

            return (
              <button
                key={liftId}
                type="button"
                onClick={() => onOpenLift(liftId)}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-800/50 active:bg-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-100 text-sm">{LIFT_DISPLAY_NAMES[liftId]}</div>
                  <div className="text-xs text-gray-500">{prDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-gray-100">
                    {pr ? `${pr.weight} ${state.units}` : '—'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Current: {lift.currentWeight} {state.units}
                  </div>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
