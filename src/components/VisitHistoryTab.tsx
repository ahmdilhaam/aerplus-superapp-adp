import { useEffect, useState } from 'react'
import { MapPin, Clock, FileText } from 'lucide-react'
import type { VisitHistory } from '../types'
import { getVisitHistory } from '../services/api'
import { Badge } from './Badge'

export const VisitHistoryTab: React.FC = () => {
  const [history, setHistory] = useState<VisitHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getVisitHistory()
        setHistory(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const getStatusVariant = (status: VisitHistory['status']): 'success' | 'error' => {
    return status === 'Completed' ? 'success' : 'error'
  }

  if (loading) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
        <p className="text-secondary-400 font-black uppercase tracking-[0.2em] text-[10px]">Retrieving Records...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-rose-50/50 rounded-[2rem] border border-rose-100">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
          <FileText size={32} strokeWidth={2.5} />
        </div>
        <p className="text-rose-900 font-black uppercase tracking-tight">Access Denied</p>
        <p className="text-rose-500 text-xs font-bold mt-1">{error}</p>
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-20 bg-secondary-50/50 rounded-[2rem] border border-secondary-100">
        <div className="w-16 h-16 bg-secondary-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-secondary-300">
          <FileText size={32} strokeWidth={1} />
        </div>
        <p className="text-secondary-900 font-black uppercase tracking-tight">No Historical Data</p>
        <p className="text-secondary-400 text-xs font-bold mt-1">Archived records will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {history.map((visit) => (
        <div
          key={visit.id}
          className="group relative bg-white rounded-[2rem] border border-secondary-100 p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-secondary-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-50 rounded-2xl flex items-center justify-center text-secondary-900 shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-colors duration-500">
                <FileText size={24} strokeWidth={2.5} />
              </div>
              <div>
                <hgroup>
                  <h3 className="text-xl font-black text-secondary-900 tracking-tight leading-tight">{visit.title}</h3>
                  <p className="text-secondary-400 text-[10px] font-black uppercase tracking-widest mt-1">Visit ID: {String(visit.id).substring(0, 8)}</p>
                </hgroup>
              </div>
            </div>
            <Badge variant={getStatusVariant(visit.status)} label={visit.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Clock size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-secondary-900 font-black text-sm tracking-tight">{visit.date}</p>
                <p className="text-secondary-400 text-[10px] font-black uppercase tracking-widest">Duration: {visit.duration}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-secondary-900 font-black text-sm tracking-tight truncate max-w-[200px]">{visit.location}</p>
                <p className="text-secondary-400 text-[10px] font-black uppercase tracking-widest">Geo-coordinated</p>
              </div>
            </div>
          </div>

          {visit.notes && (
            <div className="bg-secondary-50 rounded-[1.5rem] p-6 relative overflow-hidden group-hover:bg-secondary-100/50 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText size={48} />
              </div>
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-2">Observations & Notes</p>
                  <p className="text-sm text-secondary-600 font-semibold leading-relaxed">{visit.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
