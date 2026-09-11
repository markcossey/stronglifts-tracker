import { useState, useEffect } from 'react'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase('hold'), 50)
    const exitTimer = setTimeout(() => setPhase('exit'), 1200)
    const doneTimer = setTimeout(onDone, 1700)
    return () => {
      clearTimeout(holdTimer)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      style={{
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 500ms ease-out',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-48 h-48"
        fill="none"
        stroke="white"
        strokeWidth={3.5}
        strokeLinejoin="round"
        style={{
          transform: phase === 'enter' ? 'scale(0.85)' : 'scale(1)',
          transition: 'transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <polygon points="50,13.4 93.3,88.4 6.7,88.4" />
      </svg>
    </div>
  )
}
