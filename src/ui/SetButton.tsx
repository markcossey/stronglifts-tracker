import { useState } from 'react'

interface SetButtonProps {
  targetReps: number
  actualReps: number | null
  onComplete: () => void
  onFail: (reps: number) => void
  onReset: () => void
}

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
    if (isPending) {
      onComplete()
    } else if (isComplete) {
      setShowRepPicker(true)
    } else {
      setShowRepPicker(false)
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
    <div className="relative">
      <button
        type="button"
        onClick={handleTap}
        className={`w-16 h-16 rounded-full border-[2.5px] ${borderColor} ${bgColor} ${textColor} flex items-center justify-center text-xl font-bold select-none active:scale-95 transition-all`}
      >
        {content}
      </button>
      {showRepPicker && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-2 flex gap-1 z-10">
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
      )}
    </div>
  )
}
