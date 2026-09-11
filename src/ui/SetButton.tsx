import { useState } from 'react'

interface SetButtonProps {
  targetReps: number
  actualReps: number | null
  onComplete: () => void
  onFail: (reps: number) => void
  onReset: () => void
}

// The rep picker is positioned against the nearest `relative` ancestor (the set row), so it
// stays on screen for the first and last sets.
export default function SetButton({
  targetReps,
  actualReps,
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

  if (isComplete) {
    borderColor = 'border-white'
    bgColor = 'bg-white'
    textColor = 'text-black'
    content = (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="black" strokeWidth={3}>
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  } else if (isFailed) {
    borderColor = 'border-red-500'
    bgColor = 'bg-transparent'
    textColor = 'text-red-500'
    content = String(actualReps)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTap}
        className={`flex-1 max-w-16 aspect-square rounded-full border-[2.5px] ${borderColor} ${bgColor} ${textColor} flex items-center justify-center text-xl font-bold select-none active:scale-95 transition-all ${
          showRepPicker ? 'relative z-20 ring-2 ring-red-500 ring-offset-2 ring-offset-gray-900' : ''
        }`}
      >
        {content}
      </button>
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
                <button
                  key={i}
                  type="button"
                  onClick={() => handleRepSelect(i)}
                  className="w-10 h-10 rounded-lg bg-red-900/50 text-red-400 font-bold hover:bg-red-900 active:bg-red-800 text-sm"
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
