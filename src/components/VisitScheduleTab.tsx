import { useEffect, useState } from 'react'
import { MapPin, Clock, Plus, AlertCircle, ImageOff } from 'lucide-react'
import type { VisitScheduleResponse } from '../types'
import { getVisitSchedule } from '../services/api'
import { Badge } from './Badge'
import { Button } from './Button'
import { ImageWithFallback } from './ImageWithFallback'

export const VisitScheduleTab: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<VisitScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getVisitSchedule()
        setScheduleData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [])

  const getStatusVariant = (statusCode: string): 'success' | 'warning' | 'error' => {
    const statusMap: Record<string, 'success' | 'warning' | 'error'> = {
      completed: 'success',
      scheduled: 'warning',
      failed: 'error',
    }
    return statusMap[statusCode] || 'warning'
  }

  const getDotColorClass = (color: string): string => {
    const colorMap: Record<string, string> = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      grey: 'bg-gray-400',
      red: 'bg-red-500',
      blue: 'bg-blue-500',
    }
    return colorMap[color] || 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-secondary-400 font-black uppercase tracking-[0.2em] text-[10px]">Syncing Timeline...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-rose-50/50 rounded-4xl border border-rose-100">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
          <AlertCircle size={32} strokeWidth={2.5} />
        </div>
        <p className="text-rose-900 font-black uppercase tracking-tight">Timeline Offline</p>
        <p className="text-rose-500 text-xs font-bold mt-1">{error}</p>
      </div>
    )
  }

  if (!scheduleData) {
    return (
      <div className="text-center py-20 bg-secondary-50/50 rounded-4xl border border-secondary-100">
        <p className="text-secondary-900 font-black uppercase tracking-tight">Empty Calendar</p>
      </div>
    )
  }

  const { calendarStrip, visitsList, hasAddScheduleButton } = scheduleData

  return (
    <div className="space-y-10">
      {/* Calendar Strip */}
      {calendarStrip && (
        <div className="bg-white rounded-4xl border border-secondary-100 p-8 shadow-sm">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-secondary-900 tracking-tight">{calendarStrip.rangeLabel}</h3>
              <p className="text-secondary-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Operation Timeline</p>
            </div>
            {hasAddScheduleButton && (
              <Button variant="primary" className="flex items-center gap-2 px-6">
                <Plus className="w-4 h-4" strokeWidth={3} />
                Shift Record
              </Button>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {calendarStrip.days.map((day, index) => (
              <div
                key={index}
                className={`flex flex-col items-center justify-center min-w-18 px-4 py-6 rounded-3xl border-2 transition-all duration-300 ${day.active
                  ? 'border-primary-600 bg-primary-50 text-primary-600 shadow-lg shadow-primary-200/50 ring-4 ring-primary-500/10'
                  : day.isHoliday
                    ? 'border-secondary-100 bg-secondary-50 opacity-40 grayscale'
                    : 'border-secondary-50 bg-secondary-50/30 text-secondary-400 hover:border-secondary-200 hover:bg-white'
                  }`}
              >
                <p className={`text-[10px] font-black uppercase tracking-tighter mb-2 ${day.isHoliday ? 'text-rose-500' : ''}`}>
                  {day.dayLabel}
                </p>
                <p className="text-2xl font-black tracking-tighter">
                  {day.dateNum}
                </p>
                {day.dotColor && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-3 ${getDotColorClass(day.dotColor)} shadow-sm blur-[0.5px]`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visits List */}
      <div className="bg-white rounded-4xl border border-secondary-100 p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shadow-inner">
            <Clock size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-black text-secondary-900 tracking-tight">Shift Sequence</h3>
            <p className="text-secondary-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Chronological list</p>
          </div>
        </div>

        {visitsList && visitsList.length > 0 ? (
          <div className="space-y-6">
            {visitsList.map((visit) => (
              <div
                key={visit.id}
                className="group relative bg-secondary-50/50 rounded-3xl border border-transparent hover:border-primary-200 hover:bg-white transition-all duration-300 overflow-hidden"
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
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary-600 shadow-sm">
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
                      <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2 group-hover:text-primary-600 transition-colors">
                        {visit.depotName}
                      </h4>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                          <MapPin className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <p className="text-sm text-secondary-500 font-medium leading-relaxed">{visit.address}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-secondary-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                        <span>Managed Visit</span>
                        <div className="w-1 h-1 bg-secondary-200 rounded-full"></div>
                        <span className="text-primary-600 font-extrabold">{visit.status}</span>
                      </div>
                      <button className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Open Details →</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-secondary-50 rounded-4xl border border-dashed border-secondary-200">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 border border-secondary-100 shadow-sm text-secondary-200">
              <Clock size={32} strokeWidth={1} />
            </div>
            <p className="text-secondary-400 font-bold text-sm">No activity recorded for this period</p>
          </div>
        )}
      </div>
    </div>
  )
}
