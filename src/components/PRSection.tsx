import type { AppState } from '../model/types'
import { ALL_LIFTS, LIFT_DISPLAY_NAMES } from '../model/defaults'
import { getWorkoutStats } from '../model/programme'

interface PRSectionProps {
  state: AppState
}

export default function PRSection({ state }: PRSectionProps) {
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
            const prDate = lift.personalRecordDate
              ? new Date(lift.personalRecordDate + 'T00:00:00').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'

            return (
              <div key={liftId} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-100 text-sm">{LIFT_DISPLAY_NAMES[liftId]}</div>
                  <div className="text-xs text-gray-500">{prDate}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-gray-100">
                    {lift.personalRecord} {state.units}
                  </div>
                  <div className="text-xs text-gray-500">
                    Current: {lift.currentWeight} {state.units}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
