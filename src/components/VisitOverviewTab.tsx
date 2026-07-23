import { useEffect, useState } from 'react'
import { CheckCircle, Clock, AlertCircle, MapPin, Calendar, Bell, ImageOff } from 'lucide-react'
import type { VisitOverview } from '../types'
import { getVisitOverview } from '../services/api'
import { StatCard } from './StatCard'
import { Badge } from './Badge'
import { ImageWithFallback } from './ImageWithFallback'

export const VisitOverviewTab: React.FC = () => {
  const [overview, setOverview] = useState<VisitOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getVisitOverview()
        setOverview(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview')
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-secondary-400 font-black uppercase tracking-[0.2em] text-[10px]">Processing Pulse...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-rose-50/50 rounded-[2rem] border border-rose-100">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
          <AlertCircle size={32} strokeWidth={2.5} />
        </div>
        <p className="text-rose-900 font-black uppercase tracking-tight">Signal Lost</p>
        <p className="text-rose-500 text-xs font-bold mt-1">{error}</p>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="text-center py-20 bg-secondary-50/50 rounded-[2rem] border border-secondary-100">
        <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center text-secondary-400 mx-auto mb-4">
          <Bell size={32} strokeWidth={2.5} />
        </div>
        <p className="text-secondary-900 font-black uppercase tracking-tight">No Activity Found</p>
        <p className="text-secondary-400 text-xs font-bold mt-1">Start by scheduling your first visit</p>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Visits',
      value: (overview.summary?.totalVisit ?? 0).toString(),
      icon: Calendar,
      change: 0,
      changeLabel: '',
    },
    {
      title: 'Success Rate',
      value: `${overview.summary?.totalVisit ? Math.round(((overview.summary?.completed ?? 0) / overview.summary.totalVisit) * 100) : 0}%`,
      icon: CheckCircle,
      change: 0,
      changeLabel: 'Completed tasks',
    },
    {
      title: 'Queued',
      value: (overview.summary?.scheduled ?? 0).toString(),
      icon: Clock,
      change: 0,
      changeLabel: 'Upcoming shifts',
    },
    {
      title: 'Critical',
      value: (overview.summary?.failed ?? 0).toString(),
      icon: AlertCircle,
      change: 0,
      changeLabel: 'Needs attention',
    },
  ]

  const getStatusVariant = (statusCode: string): 'success' | 'warning' | 'error' | 'default' => {
    const statusMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      completed: 'success',
      scheduled: 'warning',
      failed: 'error',
    }
    return statusMap[statusCode] || 'default'
  }

  return (
    <div className="space-y-10">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeLabel={stat.changeLabel}
          />
        ))}
      </div>

      {/* Visits Today */}
      {overview.visitsToday && (
        <div className="bg-white rounded-[2rem] border border-secondary-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 shadow-inner">
                <Calendar size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-secondary-900 tracking-tight">Daily Rollout</h3>
                <p className="text-secondary-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Scheduled for today</p>
              </div>
            </div>
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-secondary-200"></div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-600 flex items-center justify-center text-[10px] text-white font-black">+5</div>
            </div>
          </div>
          <div className="space-y-6">
            {overview.visitsToday.items && overview.visitsToday.items.length > 0 ? (
              overview.visitsToday.items.map((visit) => (
                <div
                  key={visit.id}
                  className="group relative bg-secondary-50/50 rounded-[1.5rem] border border-transparent hover:border-primary-200 hover:bg-white transition-all duration-300 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-56 h-48 md:h-auto shrink-0 relative overflow-hidden">
                      <ImageWithFallback
                        src={visit.imageUrl}
                        alt={visit.depotName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        fallback={
                          <div className="w-full h-full bg-secondary-100 flex items-center justify-center">
                            <ImageOff size={28} className="text-secondary-400" />
                          </div>
                        }
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">View Depot Detail</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary-600 shadow-sm border border-secondary-100">
                              <Clock className="w-4 h-4" strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-black text-secondary-900 tracking-tight">
                              {visit.time}
                            </span>
                          </div>
                          <Badge
                            variant={getStatusVariant(visit.statusCode)}
                            label={visit.status}
                          />
                        </div>
                        <h3 className="text-xl font-black text-secondary-900 tracking-tight mb-2 group-hover:text-primary-600 transition-colors">
                          {visit.depotName}
                        </h3>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                            <MapPin className="w-3 h-3" strokeWidth={3} />
                          </div>
                          <p className="text-sm text-secondary-500 font-medium leading-relaxed">{visit.address}</p>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-secondary-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 border border-white"></div>
                          <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Assigned Agent</span>
                        </div>
                        <button className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all">Details →</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-secondary-50 rounded-2xl border border-dashed border-secondary-200">
                <p className="text-secondary-400 font-bold text-sm">No scheduled visits for today</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reminder */}
      {overview.reminder && (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary-200">
          <div className="absolute top-0 right-0 -m-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -m-10 w-32 h-32 bg-primary-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex items-start gap-6">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <Bell className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="inline-block px-3 py-1 bg-primary-400/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-3">Priority Alert</div>
              <h3 className="text-xl font-black tracking-tight mb-2">{overview.reminder.date}</h3>
              <p className="text-primary-100 font-medium text-sm leading-relaxed max-w-2xl">{overview.reminder.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
