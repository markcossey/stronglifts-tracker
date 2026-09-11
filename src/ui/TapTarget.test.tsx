import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import TapTarget from './TapTarget'

describe('TapTarget', () => {
  test('with haptics on, an invisible native switch overlays the visual and handles the tap', () => {
    const onTap = vi.fn()
    render(<TapTarget haptic onTap={onTap} label="Set 1"><span>5</span></TapTarget>)

    const input = screen.getByLabelText('Set 1') as HTMLInputElement
    expect(input.type).toBe('checkbox')
    expect(input.hasAttribute('switch')).toBe(true)
    expect(input.className).toContain('opacity-0')

    fireEvent.click(input)
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  test('with haptics off, it is a plain button with no switch', () => {
    const onTap = vi.fn()
    const { container } = render(<TapTarget haptic={false} onTap={onTap} label="Set 1"><span>5</span></TapTarget>)

    expect(container.querySelector('input')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Set 1' }))
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  test('reflects a controlled on/off state for settings toggles', () => {
    const { rerender } = render(<TapTarget haptic checked={false} onTap={() => {}} label="Sound"><span /></TapTarget>)
    expect((screen.getByLabelText('Sound') as HTMLInputElement).checked).toBe(false)

    rerender(<TapTarget haptic checked onTap={() => {}} label="Sound"><span /></TapTarget>)
    expect((screen.getByLabelText('Sound') as HTMLInputElement).checked).toBe(true)
  })
})
