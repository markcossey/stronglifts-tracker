import { useState } from 'react'
import type { AppState, LiftId } from '../model/types'
import { ALL_LIFTS, LIFT_DISPLAY_NAMES } from '../model/defaults'
import LiftChart from './LiftChart'
import PRSection from './PRSection'

interface ProgressProps {
  state: AppState
}

type ChartRange = '10' | '30' | 'all'

export default function Progress({ state }: ProgressProps) {
  const [selectedLift, setSelectedLift] = useState<LiftId>('squat')
  const [range, setRange] = useState<ChartRange>('30')

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Progress</h1>

      <PRSection state={state} />

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-100">Weight Over Time</h3>
          <div className="flex gap-1">
            {(['10', '30', 'all'] as ChartRange[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  range === r
                    ? 'bg-[#1a4a16]/50 text-[#47c23f]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {r === 'all' ? 'All' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {ALL_LIFTS.map(liftId => (
            <button
              key={liftId}
              type="button"
              onClick={() => setSelectedLift(liftId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedLift === liftId
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {LIFT_DISPLAY_NAMES[liftId]}
            </button>
          ))}
        </div>

        <LiftChart
          liftId={selectedLift}
          workouts={state.workouts}
          units={state.units}
          range={range}
        />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          StrongLifts Progression Rules
        </h3>
        <div className="text-xs text-gray-400 space-y-2">
          <p><strong className="text-gray-300">Success:</strong> Complete all prescribed reps → weight increases next session.</p>
          <p><strong className="text-gray-300">Failure:</strong> Miss any reps → attempt same weight next session.</p>
          <p><strong className="text-gray-300">Deload:</strong> 3 consecutive failures at the same weight → reduce weight by 10%.</p>
          <p><strong className="text-gray-300">Scheme change:</strong> 3 deloads on the same lift → switch from 5×5 to 3×5, then 3×3, then 1×5.</p>
        </div>
      </div>
    </div>
  )
}
