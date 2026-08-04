/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Calendar,
  CalendarDays,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
} from 'lucide-react'
import type { AdminVisitScheduleResponse, Outlet } from '../types'
import { getAdminVisitSchedule, getOutlets } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { VisitCalendarView } from '../components/VisitCalendarView'
import { VisitListView } from '../components/VisitListView'
import { MS_PER_DAY, addDays, formatWeekRange, startOfWeek } from '../utils/visitDate'

// Searchable outlet filter keyed by outlet id
interface OutletFilterProps {
  outlets: Outlet[]
  value: string
  onChange: (id: string) => void
}

const OutletFilter: React.FC<OutletFilterProps> = ({ outlets, value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return outlets
    return outlets.filter((o) => o.name.toLowerCase().includes(q))
  }, [outlets, query])

  const selectedOutlet = outlets.find((o) => o.id === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-left flex items-center justify-between gap-2"
      >
        <span className={selectedOutlet ? 'text-secondary-700 truncate' : 'text-secondary-400'}>
          {selectedOutlet ? selectedOutlet.name : 'Semua Outlet'}
        </span>
        <ChevronDown size={16} className={`text-secondary-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-secondary-100 rounded-2xl shadow-xl max-h-80 overflow-hidden flex flex-col">
          <div className="relative p-2 border-b border-secondary-100">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400" size={14} />
            <input
              type="text"
              autoFocus
              placeholder="Cari outlet..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-secondary-50 border border-secondary-100 rounded-xl text-sm font-semibold text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 placeholder:text-secondary-400 placeholder:font-medium"
            />
          </div>
          <div className="overflow-y-auto flex-1 py-1">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
                setQuery('')
              }}
              className={`w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-secondary-50 transition-colors ${value === '' ? 'bg-primary-50 text-primary-700' : 'text-secondary-500'}`}
            >
              Semua Outlet
            </button>
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-secondary-400 italic">Tidak ada outlet cocok</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-primary-50 transition-colors ${value === o.id ? 'bg-primary-50 text-primary-700' : 'text-secondary-700'
                    }`}
                >
                  {o.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const VisitSchedules: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  // Filter Sumber hanya relevan untuk pemegang audit.read (Company Admin & Super
  // Admin). Role lain — termasuk HOFO — tidak melihat kontrolnya, dan server pun
  // tetap memotong hasilnya ke jalur SPV, jadi ini murni penyembunyian UI.
  const { user } = useAuth()
  const role = user?.role || user?.companyRoles?.[0]
  const canFilterSource = role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN'
  const [source, setSource] = useState<'all' | 'spv' | 'audit'>('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [weekStart, setWeekStart] = useState<string>(() => startOfWeek(today))
  const [startDate, setStartDate] = useState<string>(weekAgo)
  const [endDate, setEndDate] = useState<string>(today)
  const [outletId, setOutletId] = useState<string>('')
  const [data, setData] = useState<AdminVisitScheduleResponse | null>(null)
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch outlets once on mount for dropdown
  useEffect(() => {
    getOutlets()
      .then((rows) => setOutlets(rows))
      .catch(() => setOutlets([]))
  }, [])

  // In calendar mode the range is always the Mon–Sun week; in list mode the user picks it.
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])
  const rangeStart = viewMode === 'calendar' ? weekStart : startDate
  const rangeEnd = viewMode === 'calendar' ? weekEnd : endDate

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const fetchSchedule = useCallback(async () => {
    const spanDays = (Date.parse(rangeEnd) - Date.parse(rangeStart)) / MS_PER_DAY
    if (Number.isNaN(spanDays) || spanDays < 0) {
      setLoading(false)
      alert('Tanggal akhir tidak boleh sebelum tanggal mulai')
      return
    }
    if (spanDays > 7) {
      setLoading(false)
      alert('Rentang tanggal maksimal 7 hari')
      return
    }
    try {
      setLoading(true)
      setError(null)
      const result = await getAdminVisitSchedule({
        start_date: rangeStart || undefined,
        end_date: rangeEnd || undefined,
        outlet_id: outletId || undefined,
        source: canFilterSource ? source : undefined,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal kunjungan')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [rangeStart, rangeEnd, outletId, source, canFilterSource])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const isRange = !!data && data.startDate !== data.endDate

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Visits</h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Jadwal kunjungan, agenda & libur per supervisor
            {data && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
                {data.startDate === data.endDate ? data.startDate : `${data.startDate} – ${data.endDate}`}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Outlet searchable dropdown */}
        <div className="flex flex-col gap-1 flex-1 min-w-55">
          <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Outlet</label>
          <OutletFilter outlets={outlets} value={outletId} onChange={setOutletId} />
        </div>

        {/* Sumber jalur kunjungan — hanya untuk pemegang audit.read */}
        {canFilterSource && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Sumber</label>
            <div className="relative">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as 'all' | 'spv' | 'audit')}
                className="w-full px-4 py-3 pr-10 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700 appearance-none cursor-pointer"
              >
                <option value="all">Semua</option>
                <option value="spv">SPV</option>
                <option value="audit">Audit</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-400" />
            </div>
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Tampilan</label>
          <div className="flex items-center gap-1 p-1 bg-white border border-secondary-100 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50'
                }`}
            >
              <CalendarDays size={14} />
              Kalender
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50'
                }`}
            >
              <List size={14} />
              List
            </button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          /* Week navigator — always Monday through Sunday */
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Minggu</label>
            <div className="flex items-center gap-1 p-1 bg-white border border-secondary-100 rounded-2xl shadow-sm">
              <button
                type="button"
                aria-label="Minggu sebelumnya"
                onClick={() => setWeekStart((w) => addDays(w, -7))}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-secondary-500 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-sm font-black text-secondary-700 whitespace-nowrap min-w-37.5 text-center">
                {formatWeekRange(weekStart, weekEnd)}
              </span>
              <button
                type="button"
                aria-label="Minggu berikutnya"
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-secondary-500 hover:bg-secondary-50 hover:text-primary-600 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(startOfWeek(today))}
                disabled={weekStart === startOfWeek(today)}
                className="ml-1 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 border border-primary-100 hover:bg-primary-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Minggu Ini
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Start date */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-3 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700"
              />
            </div>

            {/* End date */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-3 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700"
              />
            </div>
          </>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-24 bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-rose-50/30 opacity-50" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-lg shadow-rose-200">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2">Visits Error</h4>
            <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px] bg-rose-50 px-4 py-1.5 rounded-full inline-block mb-4">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-32 bg-white rounded-2xl border border-secondary-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="text-center relative z-10">
            <div className="relative mb-6 mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Memuat jadwal...</p>
            <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">Please wait a moment</p>
          </div>
        </div>
      ) : !error && data && data.supervisors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-secondary-200">
          <div className="w-24 h-24 bg-secondary-50 rounded-2xl flex items-center justify-center mb-6 text-secondary-200 border border-secondary-100">
            <Calendar size={40} strokeWidth={1} />
          </div>
          <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Tidak Ada Jadwal Kunjungan</p>
          <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">
            {outletId || (canFilterSource && source !== 'all')
              ? 'Coba sesuaikan filter pencarian'
              : 'Belum ada jadwal kunjungan untuk tanggal ini'}
          </p>
        </div>
      ) : !error && data ? (
        viewMode === 'calendar' ? (
          <VisitCalendarView supervisors={data.supervisors} weekDays={weekDays} today={today} />
        ) : (
          <VisitListView supervisors={data.supervisors} isRange={isRange} />
        )
      ) : null}
    </div>
  )
}
