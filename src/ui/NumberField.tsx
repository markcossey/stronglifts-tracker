import { useEffect, useState } from 'react'

interface NumberFieldProps {
  id: string
  value: number
  min: number
  step: number
  onCommit: (value: number) => void
  className?: string
}

export default function NumberField({ id, value, min, step, onCommit, className = '' }: NumberFieldProps) {
  const [text, setText] = useState(String(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  function commit() {
    const num = parseFloat(text)
    if (isNaN(num) || num < min) {
      setText(String(value))
    } else if (num !== value) {
      onCommit(num)
    }
  }

  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      value={text}
      onChange={e => setText(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        commit()
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      className={className}
    />
  )
}
