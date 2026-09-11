import type { AppState, LiftId } from '../model/types'
import { ALL_LIFTS, LIFT_DISPLAY_NAMES } from '../model/defaults'
import StatusBadge from '../ui/StatusBadge'
import Sparkline from '../ui/Sparkline'

interface DashboardProps {
  state: AppState
  onOpenLift: (liftId: LiftId) => void
}

export default function Dashboard({ state, onOpenLift }: DashboardProps) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Current Lifts</h3>
      </div>
      <div className="divide-y divide-gray-800">
        {ALL_LIFTS.map(liftId => {
          const lift = state.lifts[liftId]
          const increment = state.increments[liftId]
          return (
            <button
              key={liftId}
              type="button"
              onClick={() => onOpenLift(liftId)}
              className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-800/50 active:bg-gray-800 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-100 text-sm">{LIFT_DISPLAY_NAMES[liftId]}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {lift.currentWeight} {state.units}
                  {lift.status === 'progressing' && (
                    <span className="text-green-400"> → {lift.currentWeight + increment} {state.units}</span>
                  )}
                </div>
              </div>
              <Sparkline liftId={liftId} workouts={state.workouts} />
              <StatusBadge status={lift.status} failureCount={lift.failureCount} />
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
