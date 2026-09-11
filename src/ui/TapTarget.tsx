import type { ReactNode } from 'react'

interface TapTargetProps {
  haptic: boolean
  onTap: () => void
  label: string
  children: ReactNode
  id?: string
  checked?: boolean
  round?: string
  className?: string
}

// Since iOS 26.5 a web page only gets a haptic from a real tap on a native switch control, so with
// haptics on, an invisible <input type="checkbox" switch> sits over the visual and takes the tap.
// It must stay rendered (opacity 0, not display: none) with its native appearance intact, or iOS
// plays no haptic. There is no way to silence that haptic, so with haptics off this is a plain button.
export default function TapTarget({
  haptic,
  onTap,
  label,
  children,
  id,
  checked,
  round = '0',
  className = '',
}: TapTargetProps) {
  if (!haptic) {
    return (
      <button
        id={id}
        type="button"
        aria-label={label}
        role={checked === undefined ? undefined : 'switch'}
        aria-checked={checked}
        onClick={onTap}
        className={`group grid ${className}`}
      >
        {children}
      </button>
    )
  }

  return (
    <span className={`group grid ${className}`}>
      <span aria-hidden="true" className="[grid-area:1/1] grid pointer-events-none">
        {children}
      </span>
      <input
        id={id}
        type="checkbox"
        aria-label={label}
        ref={el => el?.setAttribute('switch', '')}
        {...(checked === undefined ? {} : { checked })}
        onChange={onTap}
        className="[grid-area:1/1] m-0 w-full h-full opacity-0 cursor-pointer"
        style={{
          clipPath: `inset(0 round ${round})`,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      />
    </span>
  )
}
