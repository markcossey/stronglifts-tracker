import type { AppState } from '../model/types'
import { formatReviewMonth, reviewSnippet } from '../model/reviews'

interface ReviewsCardProps {
  state: AppState
  onOpen: () => void
}

export default function ReviewsCard({ state, onOpen }: ReviewsCardProps) {
  const reviews = state.reviews ?? []
  const latest = reviews[0]

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-gray-900 rounded-xl border border-gray-800 px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-800/50 active:bg-gray-800 transition-colors"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Monthly Reviews</div>
        {latest ? (
          <>
            <div className="mt-1 text-gray-100 font-medium">{formatReviewMonth(latest.month)}</div>
            <div className="text-xs text-gray-500 truncate">{reviewSnippet(latest.markdown)}</div>
          </>
        ) : (
          <div className="mt-1 text-sm text-gray-500">No reviews saved yet</div>
        )}
      </div>
      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
