import type { AppState } from '../model/types'
import { ALL_LIFTS, LIFT_DISPLAY_NAMES } from '../model/defaults'
import StatusBadge from '../ui/StatusBadge'
import Sparkline from '../ui/Sparkline'

interface DashboardProps {
  state: AppState
}

export default function Dashboard({ state }: DashboardProps) {
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
            <div key={liftId} className="px-4 py-3 flex items-center justify-between">
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
