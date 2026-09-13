import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { createAppState } from '../model/programme'
import { DEFAULT_STARTING_WEIGHTS_KG } from '../model/defaults'
import { LIFT_TECHNIQUE } from '../model/technique'
import LiftDetail from './LiftDetail'

const state = createAppState('kg', DEFAULT_STARTING_WEIGHTS_KG)

describe('LiftDetail tabs', () => {
  test('opens on Progress', () => {
    render(<LiftDetail liftId="squat" state={state} onBack={() => {}} />)

    expect(screen.getByRole('tab', { name: 'Progress' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Personal Records')).toBeTruthy()
    expect(screen.queryByRole('img', { name: /Animation of the Squat/ })).toBeNull()
  })

  test('shows the animation and cues on the Technique tab', () => {
    render(<LiftDetail liftId="squat" state={state} onBack={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Technique' }))

    expect(screen.getByRole('img', { name: /Animation of the Squat/ })).toBeTruthy()
    expect(screen.getByText(LIFT_TECHNIQUE.squat.summary)).toBeTruthy()
    expect(screen.getByText(LIFT_TECHNIQUE.squat.setup[0])).toBeTruthy()
    expect(screen.getByText(LIFT_TECHNIQUE.squat.mistakes[0])).toBeTruthy()
    expect(screen.queryByText('Personal Records')).toBeNull()
  })

  test('switches back to Progress', () => {
    render(<LiftDetail liftId="bench" state={state} onBack={() => {}} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Technique' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Progress' }))

    expect(screen.getByText('Personal Records')).toBeTruthy()
    expect(screen.queryByRole('img', { name: /Animation of the/ })).toBeNull()
  })

  test('back button calls onBack', () => {
    const onBack = vi.fn()
    render(<LiftDetail liftId="deadlift" state={state} onBack={onBack} />)

    fireEvent.click(screen.getByLabelText('Back'))

    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
