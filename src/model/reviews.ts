import type { AppState, SavedReview } from './types'
import { localDateString } from './dates'

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

export function currentMonth(date = new Date()): string {
  return localDateString(date).slice(0, 7)
}

// Reviews are named by month: "2026-09" from a filename or heading, or "September 2026" in the text
export function detectReviewMonth(markdown: string): string | null {
  const head = markdown.slice(0, 400)

  const iso = head.match(/(20\d{2})-(0[1-9]|1[0-2])/)
  if (iso) return `${iso[1]}-${iso[2]}`

  const named = head.toLowerCase().match(new RegExp(`(${MONTH_NAMES.join('|')})\\s+(20\\d{2})`))
  if (named) {
    const month = MONTH_NAMES.indexOf(named[1]) + 1
    return `${named[2]}-${String(month).padStart(2, '0')}`
  }

  return null
}

export function formatReviewMonth(month: string): string {
  return new Date(month + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

// One review per month: saving the same month again replaces it. Newest first.
export function saveReview(state: AppState, review: SavedReview): AppState {
  const others = (state.reviews ?? []).filter(r => r.month !== review.month)
  return { ...state, reviews: [...others, review].sort((a, b) => b.month.localeCompare(a.month)) }
}

export function deleteReview(state: AppState, month: string): AppState {
  return { ...state, reviews: (state.reviews ?? []).filter(r => r.month !== month) }
}

export function reviewSnippet(markdown: string, length = 90): string {
  const firstProse = markdown
    .split('\n')
    .map(line => line.trim())
    .find(line => line.length > 0 && !line.startsWith('#'))
  if (!firstProse) return ''
  return firstProse.length > length ? `${firstProse.slice(0, length).trimEnd()}…` : firstProse
}
