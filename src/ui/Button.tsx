import type { ButtonHTMLAttributes } from 'react'

const variants = {
  primary: 'bg-[#3da836] text-white hover:bg-[#47c23f] active:bg-[#348f2e]',
  secondary: 'bg-gray-800 text-gray-200 hover:bg-gray-700 active:bg-gray-600',
  danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
  ghost: 'bg-transparent text-[#47c23f] hover:bg-gray-800 active:bg-gray-700',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3.5 text-lg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-xl font-semibold transition-colors
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    />
  )
}
