import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-xl shadow-primary-600/25 border border-primary-500',
  secondary: 'bg-white text-secondary-700 hover:bg-secondary-50 active:bg-secondary-100 border border-secondary-200 shadow-sm',
  danger: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 active:from-rose-700 active:to-rose-800 shadow-lg shadow-rose-500/20',
  ghost: 'bg-transparent text-secondary-500 hover:bg-secondary-100/50 hover:text-secondary-900 active:bg-secondary-100',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses =
    'px-8 py-3.5 rounded-[1.25rem] font-black uppercase tracking-[0.15em] text-[10px] md:text-xs transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center'
  const variantClass = variantClasses[variant]

  return (
    <button
      className={`${baseClasses} ${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
