import { getFunctionalSession } from '../model/functionalSessions'

interface FunctionalExerciseDetailProps {
  sessionId: string
  exerciseId: string
  onBack: () => void
}

function CueList({ title, items, tone = 'default' }: { title: string; items: string[]; tone?: 'default' | 'warning' }) {
  return (
    <section className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="flex gap-2 text-sm text-gray-300">
            <span className={tone === 'warning' ? 'text-amber-400' : 'text-sky-400'} aria-hidden="true">
              {tone === 'warning' ? '!' : '•'}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function FunctionalExerciseDetail({ sessionId, exerciseId, onBack }: FunctionalExerciseDetailProps) {
  const session = getFunctionalSession(sessionId)
  const exercise = session?.exercises.find(e => e.id === exerciseId)

  if (!session || !exercise) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-gray-200 p-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-gray-400">Exercise not found.</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-gray-200 p-1">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-100">{exercise.name}</h2>
          <p className="text-sm text-gray-400">{exercise.prescription}</p>
        </div>
      </div>

      {exercise.equipment.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {exercise.equipment.map(item => (
            <span key={item} className="text-[11px] font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
              {item}
            </span>
          ))}
        </div>
      )}

      {exercise.referenceUrl && (
        <a
          href={exercise.referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-sky-950/40 border border-sky-900 rounded-xl p-4 hover:bg-sky-950/60 transition-colors"
        >
          <div>
            <div className="font-semibold text-sky-400">Watch a demo</div>
            {exercise.referenceLabel && <div className="text-xs text-gray-400 mt-0.5">{exercise.referenceLabel}</div>}
          </div>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-sky-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M7 17L17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}

      {exercise.technique ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-300 px-1">{exercise.technique.summary}</p>
          <CueList title="Set up" items={exercise.technique.setup} />
          <CueList title="How to do it" items={exercise.technique.execution} />
          {exercise.technique.mistakes.length > 0 && (
            <CueList title="Common mistakes" items={exercise.technique.mistakes} tone="warning" />
          )}
        </div>
      ) : exercise.cue ? (
        <p className="text-sm text-gray-400 italic px-1">{exercise.cue}</p>
      ) : null}
    </div>
  )
}
