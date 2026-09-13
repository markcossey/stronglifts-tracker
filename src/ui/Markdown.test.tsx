import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import Markdown from './Markdown'

describe('Markdown', () => {
  test('renders headings, paragraphs and bullets', () => {
    const { container } = render(
      <Markdown text={'# September 2026 review\n\nTrained 9 sessions.\n\n## Squat\n\n- Climbing steadily\n- No misses'} />,
    )

    expect(screen.getByText('September 2026 review')).toBeTruthy()
    expect(screen.getByText('Squat')).toBeTruthy()
    expect(screen.getByText('Trained 9 sessions.')).toBeTruthy()
    expect(container.querySelectorAll('li')).toHaveLength(2)
  })

  test('joins wrapped lines into one paragraph', () => {
    render(<Markdown text={'Trained 9 sessions\nin the last 30 days.'} />)

    expect(screen.getByText('Trained 9 sessions in the last 30 days.')).toBeTruthy()
  })

  test('renders bold text', () => {
    const { container } = render(<Markdown text="Watch **bench press** next month." />)

    expect(container.querySelector('strong')?.textContent).toBe('bench press')
  })

  test('never injects HTML from the review text', () => {
    const { container } = render(<Markdown text={'<img src=x onerror="alert(1)">\n\nSafe.'} />)

    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">')
  })
})
