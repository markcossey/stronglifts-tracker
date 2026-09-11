import { useState } from 'react'
import TapTarget from './TapTarget'

interface SetButtonProps {
  targetReps: number
  actualReps: number | null
  haptic: boolean
  onComplete: () => void
  onFail: (reps: number) => void
  onReset: () => void
}

// The rep picker is positioned against the nearest `relative` ancestor (the set row), so it
// stays on screen for the first and last sets.
export default function SetButton({
  targetReps,
  actualReps,
  haptic,
  onComplete,
  onFail,
  onReset,
}: SetButtonProps) {
  const [showRepPicker, setShowRepPicker] = useState(false)

  const isPending = actualReps === null
  const isComplete = actualReps === targetReps
  const isFailed = actualReps !== null && actualReps < targetReps

  function handleTap() {
    if (showRepPicker) {
      setShowRepPicker(false)
    } else if (isPending) {
      onComplete()
    } else if (isComplete) {
      setShowRepPicker(true)
    } else {
      onReset()
    }
  }

  function handleRepSelect(reps: number) {
    setShowRepPicker(false)
    onFail(reps)
  }

  let borderColor = 'border-gray-300'
  let bgColor = 'bg-transparent'
  let textColor = 'text-gray-300'
  let content: React.ReactNode = String(targetReps)
  let label = `Mark set done, ${targetReps} reps`

  if (isComplete) {
    borderColor = 'border-white'
    bgColor = 'bg-white'
    textColor = 'text-black'
    content = (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="black" strokeWidth={3}>
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
    label = 'Set done. Tap to record missed reps'
  } else if (isFailed) {
    borderColor = 'border-red-500'
    bgColor = 'bg-transparent'
    textColor = 'text-red-500'
    content = String(actualReps)
    label = `${actualReps} of ${targetReps} reps. Tap to reset`
  }

  return (
    <>
      <TapTarget
        haptic={haptic}
        onTap={handleTap}
        label={label}
        round="999px"
        className={`flex-1 max-w-16 aspect-square rounded-full ${showRepPicker ? 'relative z-20' : ''}`}
      >
        <span
          className={`w-full h-full rounded-full border-[2.5px] ${borderColor} ${bgColor} ${textColor} flex items-center justify-center text-xl font-bold select-none group-active:scale-95 transition-all ${
            showRepPicker ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-gray-900' : ''
          }`}
        >
          {content}
        </span>
      </TapTarget>
      {showRepPicker && (
        <>
          <button
            type="button"
            aria-label="Close rep picker"
            onClick={() => setShowRepPicker(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 right-0 top-full mt-2 flex justify-center z-20 pointer-events-none">
            <div className="pointer-events-auto bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-2 flex gap-1">
              {Array.from({ length: targetReps }, (_, i) => (
                <TapTarget
                  key={i}
                  haptic={haptic}
                  onTap={() => handleRepSelect(i)}
                  label={`${i} reps`}
                  round="0.5rem"
                  className="w-10 h-10 rounded-lg"
                >
                  <span className="w-full h-full rounded-lg bg-red-900/50 text-red-400 font-bold group-hover:bg-red-900 group-active:bg-red-800 text-sm flex items-center justify-center">
                    {i}
                  </span>
                </TapTarget>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
