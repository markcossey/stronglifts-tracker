import { describe, expect, test } from 'vitest'
import { createAppState } from './programme'
import { DEFAULT_STARTING_WEIGHTS_KG } from './defaults'
import { currentMonth, deleteReview, detectReviewMonth, reviewSnippet, saveReview } from './reviews'

const base = createAppState('kg', DEFAULT_STARTING_WEIGHTS_KG)
const review = (month: string, markdown = `# ${month} review\n\nTrained well.`) => ({
  month,
  markdown,
  savedAt: '2026-10-01T07:10:00.000Z',
})

describe('saved reviews', () => {
  test('keeps one review per month, newest first', () => {
    let state = saveReview(base, review('2026-09'))
    state = saveReview(state, review('2026-10'))
    state = saveReview(state, review('2026-09', '# September 2026 review\n\nReplaced.'))

    expect(state.reviews?.map(r => r.month)).toEqual(['2026-10', '2026-09'])
    expect(state.reviews?.[1].markdown).toContain('Replaced.')
  })

  test('deleting removes only that month', () => {
    let state = saveReview(base, review('2026-09'))
    state = saveReview(state, review('2026-10'))

    expect(deleteReview(state, '2026-09').reviews?.map(r => r.month)).toEqual(['2026-10'])
  })

  test('detects the month from an ISO date or a written month', () => {
    expect(detectReviewMonth('# Review for 2026-09\n\nText')).toBe('2026-09')
    expect(detectReviewMonth('# September 2026 review\n\nTrained 9 sessions')).toBe('2026-09')
    expect(detectReviewMonth('# December 2025 review')).toBe('2025-12')
    expect(detectReviewMonth('no month here at all')).toBeNull()
  })

  test('current month is YYYY-MM', () => {
    expect(currentMonth(new Date(2026, 8, 13))).toBe('2026-09')
  })

  test('snippet skips headings and trims long prose', () => {
    expect(reviewSnippet('# Heading\n\nTrained 9 sessions in the last 30 days.')).toBe(
      'Trained 9 sessions in the last 30 days.',
    )
    expect(reviewSnippet(`# Heading\n\n${'x'.repeat(200)}`)).toHaveLength(91)
    expect(reviewSnippet('# Heading only')).toBe('')
  })
})
