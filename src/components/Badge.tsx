interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'default'
  label: string
}

const variantClasses = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/50 ring-emerald-500/10',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/50 ring-amber-500/10',
  error: 'bg-rose-50 text-rose-700 border-rose-200/50 ring-rose-500/10',
  info: 'bg-primary-50 text-primary-700 border-primary-200/50 ring-primary-500/10',
  default: 'bg-secondary-50 text-secondary-600 border-secondary-200/50 ring-secondary-500/10',
}

export const Badge: React.FC<BadgeProps> = ({ variant, label }) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border ring-1 ring-inset shadow-sm ${variantClasses[variant]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse opacity-70"></span>
      {label}
    </span>
  )
}
