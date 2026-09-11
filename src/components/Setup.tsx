import { useState } from 'react'
import type { LiftId, Units } from '../model/types'
import { ALL_LIFTS, LIFT_DISPLAY_NAMES, getDefaultStartingWeights } from '../model/defaults'
import Button from '../ui/Button'
import NumberField from '../ui/NumberField'

interface SetupProps {
  onComplete: (units: Units, weights: Record<LiftId, number>) => void
}

export default function Setup({ onComplete }: SetupProps) {
  const [step, setStep] = useState(0)
  const [units, setUnits] = useState<Units>('kg')
  const [weights, setWeights] = useState<Record<LiftId, number>>(getDefaultStartingWeights('kg'))

  function handleUnitsChange(u: Units) {
    setUnits(u)
    setWeights(getDefaultStartingWeights(u))
  }

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center space-y-6">
      <div className="text-6xl font-bold text-[#47c23f]">5×5</div>
      <h1 className="text-2xl font-bold text-gray-100">StrongLifts</h1>
      <p className="text-gray-400 text-lg">
        Simple strength training.<br />
        Track your workouts, follow the programme.
      </p>
      <Button size="lg" fullWidth onClick={() => setStep(1)}>
        Get Started
      </Button>
    </div>,

    // Step 1: Units
    <div key="units" className="space-y-6">
      <h2 className="text-xl font-bold text-gray-100">Choose your units</h2>
      <div className="grid grid-cols-2 gap-3">
        {(['kg', 'lb'] as Units[]).map(u => (
          <button
            key={u}
            type="button"
            onClick={() => handleUnitsChange(u)}
            className={`p-6 rounded-xl text-center border-2 transition-colors ${
              units === u
                ? 'border-[#47c23f] bg-[#1a4a16]/30 text-[#6fd468]'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
            }`}
          >
            <div className="text-3xl font-bold">{u}</div>
            <div className="text-sm mt-1">{u === 'kg' ? 'Kilograms' : 'Pounds'}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
        <Button fullWidth onClick={() => setStep(2)}>Next</Button>
      </div>
    </div>,

    // Step 2: Starting weights
    <div key="weights" className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Starting weights</h2>
        <p className="text-gray-400 text-sm mt-1">
          New to StrongLifts? Start with the bar ({units === 'kg' ? '20 kg' : '45 lb'}).
          Already training? Enter your current working weights.
        </p>
      </div>
      <div className="space-y-3">
        {ALL_LIFTS.map(liftId => (
          <div key={liftId} className="flex items-center justify-between gap-4">
            <label className="text-gray-300 font-medium flex-1" htmlFor={`weight-${liftId}`}>
              {LIFT_DISPLAY_NAMES[liftId]}
            </label>
            <div className="flex items-center gap-2">
              <NumberField
                id={`weight-${liftId}`}
                step={units === 'kg' ? 2.5 : 5}
                min={0}
                value={weights[liftId]}
                onCommit={num => setWeights(prev => ({ ...prev, [liftId]: num }))}
                className="w-24 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-right text-lg font-mono text-gray-100 focus:border-[#47c23f] focus:ring-1 focus:ring-[#47c23f] outline-none"
              />
              <span className="text-gray-500 text-sm w-6">{units}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
        <Button fullWidth onClick={() => setStep(3)}>Next</Button>
      </div>
    </div>,

    // Step 3: Confirm
    <div key="confirm" className="space-y-6">
      <h2 className="text-xl font-bold text-gray-100">Ready to start</h2>
      <div className="bg-gray-800 rounded-xl p-4 space-y-2">
        <div className="text-sm text-gray-400 mb-3">Your starting weights:</div>
        {ALL_LIFTS.map(liftId => (
          <div key={liftId} className="flex justify-between">
            <span className="text-gray-300">{LIFT_DISPLAY_NAMES[liftId]}</span>
            <span className="font-mono font-medium text-gray-100">{weights[liftId]} {units}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
        <Button fullWidth size="lg" onClick={() => onComplete(units, weights)}>
          Start Training
        </Button>
      </div>
    </div>,
  ]

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 safe-area-pt">
      <div className="w-full max-w-sm">
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-[#47c23f]' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
        {steps[step]}
      </div>
    </div>
  )
}
