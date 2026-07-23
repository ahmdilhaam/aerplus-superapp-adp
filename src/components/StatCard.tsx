import { ArrowUp, ArrowDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  change: number
  changeLabel?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = 'vs last month',
}) => {
  const isPositive = change >= 0

  return (
    <div className="bg-white rounded-[2rem] border border-secondary-100 p-6 md:p-8 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] leading-none mb-3">{title}</p>
          <p className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight group-hover:text-primary-600 transition-colors duration-300">{value}</p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold ring-1 ring-inset ${isPositive
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                : 'bg-rose-50 text-rose-700 ring-rose-600/20'
                }`}
            >
              {isPositive ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
              {Math.abs(change)}%
            </span>
            <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider">{changeLabel}</span>
          </div>
        </div>
        <div className="p-4 bg-secondary-50 text-secondary-400 rounded-2xl group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm border border-secondary-100 group-hover:border-primary-500 group-hover:shadow-lg group-hover:shadow-primary-600/30 group-hover:-translate-y-1">
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  )
}
