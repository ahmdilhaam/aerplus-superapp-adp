import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  Search,
  ChevronDown,
  User,
  Clipboard,
  Sun,
  ImageOff,
} from 'lucide-react'
import type { AdminVisitItem, AdminVisitScheduleResponse, Outlet } from '../types'
import { getAdminVisitSchedule, getOutlets } from '../services/api'
import { Badge } from '../components/Badge'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { resolveApiFileUrl } from '../utils/image'
import { durationBadge } from '../utils/visitPresence'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const formatDateId = (d: string): string =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

// Group a supervisor's visits by their date (sorted ascending) for multi-day ranges.
const groupVisitsByDate = (visits: AdminVisitItem[]): Array<[string, AdminVisitItem[]]> => {
  const map = new Map<string, AdminVisitItem[]>()
  for (const v of visits) {
    const arr = map.get(v.date)
    if (arr) arr.push(v)
    else map.set(v.date, [v])
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
}

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
                  className={`w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-primary-50 transition-colors ${
                    value === o.id ? 'bg-primary-50 text-primary-700' : 'text-secondary-700'
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

const getStatusVariant = (statusCode: string): 'success' | 'warning' | 'error' | 'info' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    completed: 'success',
    scheduled: 'warning',
    missed: 'error',
    failed: 'error',
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    libur: 'info',
  }
  return map[statusCode] ?? 'warning'
}

// A schedule row renders one of three item types: outlet visit, SPV agenda
// ("Lainnya"), or holiday ("Libur"). Only visits carry an outlet.
const ScheduleItemRow: React.FC<{ item: AdminVisitItem; onPhotoClick: (url: string) => void }> = ({
  item: v,
  onPhotoClick,
}) => {
  if (v.type === 'agenda') {
    return (
      <div className="flex items-center gap-4 px-8 py-5 hover:bg-secondary-50/40 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 border border-violet-100">
          <Clipboard size={16} className="text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-secondary-900 text-sm truncate">{v.title}</p>
          <p className="text-[11px] text-secondary-400 flex items-center gap-1 mt-0.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-[9px] font-black uppercase tracking-wider">Agenda</span>
            <span className="truncate">{v.note || 'Jadwal lainnya'}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold text-secondary-600 shrink-0">
          <Clock size={13} className="text-secondary-400" />
          {v.time}
        </div>
        <div className="shrink-0">
          <Badge variant={getStatusVariant(v.statusCode)} label={v.status} />
        </div>
      </div>
    )
  }

  if (v.type === 'libur') {
    return (
      <div className="flex items-center gap-4 px-8 py-5 hover:bg-secondary-50/40 transition-colors bg-rose-50/20">
        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
          <Sun size={16} className="text-rose-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-secondary-900 text-sm truncate">{v.name}</p>
          <p className="text-[11px] text-secondary-400 mt-0.5">Hari libur</p>
        </div>
        <div className="shrink-0">
          <Badge variant="info" label={v.status} />
        </div>
      </div>
    )
  }

  // visit
  return (
    <div className="flex items-center gap-4 px-8 py-5 hover:bg-secondary-50/40 transition-colors">
      {/* Outlet image */}
      <ImageWithFallback
        src={v.outlet?.imageUrl}
        alt={v.outlet?.name ?? ''}
        className="w-12 h-12 rounded-xl object-cover border border-secondary-100 shrink-0"
        fallback={
          <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center shrink-0">
            <MapPin size={16} className="text-secondary-400" />
          </div>
        }
      />

      {/* Outlet info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-secondary-900 text-sm truncate">{v.outlet?.name}</p>
        <p className="text-[11px] text-secondary-400 flex items-center gap-1 mt-0.5">
          <MapPin size={10} />
          <span className="truncate">{v.outlet?.address}</span>
        </p>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 text-sm font-bold text-secondary-600 shrink-0">
        <Clock size={13} className="text-secondary-400" />
        {v.time}
      </div>

      {/* Presensi: foto bukti, durasi & telat — hanya bila sudah check-in */}
      {v.presence?.checkinAt && (
        <div className="shrink-0 flex items-center gap-2">
          {(() => {
            const url = resolveApiFileUrl(v.presence.checkinPhotoUrl)
            return url ? (
              <button
                type="button"
                onClick={() => onPhotoClick(url)}
                className="w-9 h-9 rounded-lg overflow-hidden border border-secondary-200 hover:ring-2 hover:ring-primary-400 transition-all shrink-0"
                title="Lihat foto presensi check-in"
              >
                <img src={url} alt="Foto bukti presensi check-in" className="w-full h-full object-cover" />
              </button>
            ) : (
              <div
                className="w-9 h-9 rounded-lg bg-secondary-100 border border-dashed border-secondary-200 flex items-center justify-center text-secondary-300 shrink-0"
                title="Foto presensi tidak tersedia"
              >
                <ImageOff size={13} />
              </div>
            )
          })()}
          {v.presence.isLate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider border border-rose-200">
              Telat
            </span>
          )}
          {(() => {
            const db = durationBadge(v.presence.durationMinutes)
            return db ? <Badge variant={db.variant} label={db.label} /> : null
          })()}
        </div>
      )}

      {/* Status badge */}
      <div className="shrink-0">
        <Badge variant={getStatusVariant(v.statusCode)} label={v.status} />
      </div>
    </div>
  )
}

export const VisitSchedules: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState<string>(weekAgo)
  const [endDate, setEndDate] = useState<string>(today)
  const [outletId, setOutletId] = useState<string>('')
  const [data, setData] = useState<AdminVisitScheduleResponse | null>(null)
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Foto bukti presensi yang sedang diperbesar (null = lightbox tertutup).
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  // Per-supervisor accordion state. Undefined = open by default; toggling stores explicit boolean.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: prev[id] === false ? true : false }))

  // Fetch outlets once on mount for dropdown
  useEffect(() => {
    getOutlets()
      .then((rows) => setOutlets(rows))
      .catch(() => setOutlets([]))
  }, [])

  const fetchSchedule = useCallback(async () => {
    const spanDays = (Date.parse(endDate) - Date.parse(startDate)) / MS_PER_DAY
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
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        outlet_id: outletId || undefined,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat jadwal kunjungan')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, outletId])

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
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Outlet</label>
          <OutletFilter outlets={outlets} value={outletId} onChange={setOutletId} />
        </div>

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
            {outletId ? 'Coba sesuaikan filter pencarian' : 'Belum ada jadwal kunjungan untuk tanggal ini'}
          </p>
        </div>
      ) : !error && data ? (
        <div className="space-y-6">
          {data.supervisors.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-[2rem] border border-secondary-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50"
            >
              {/* Supervisor header (accordion toggle) */}
              <button
                type="button"
                onClick={() => toggleExpanded(s.id)}
                className={`w-full flex items-center gap-4 px-8 py-6 text-left bg-gradient-to-r from-white to-secondary-50/30 transition-colors hover:bg-secondary-50/40 ${expanded[s.id] !== false ? 'border-b border-secondary-50' : ''}`}
              >
                <ImageWithFallback
                  src={s.avatarUrl}
                  alt={s.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-secondary-200 shrink-0"
                  fallback={
                    <div className="w-12 h-12 rounded-2xl bg-secondary-100 flex items-center justify-center shrink-0">
                      <User size={20} className="text-secondary-400" />
                    </div>
                  }
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-secondary-900 tracking-tight">{s.name}</h3>
                  <p className="text-[11px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">{s.role}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-xl bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest border border-primary-100 shrink-0">
                  {s.visits.length} jadwal
                </span>
                <ChevronDown
                  size={18}
                  className={`text-secondary-400 transition-transform shrink-0 ${expanded[s.id] !== false ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Visits list — grouped by date when the range spans multiple days */}
              {expanded[s.id] !== false &&
                (isRange ? (
                  <div>
                    {groupVisitsByDate(s.visits).map(([d, visits]) => (
                      <div key={d}>
                        <div className="flex items-center justify-between px-8 py-3 bg-secondary-50/60 border-b border-secondary-100">
                          <span className="text-[11px] font-black uppercase tracking-widest text-secondary-500 flex items-center gap-2">
                            <Calendar size={12} className="text-secondary-400" />
                            {formatDateId(d)}
                          </span>
                          <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                            {visits.length} jadwal
                          </span>
                        </div>
                        <div className="divide-y divide-secondary-50">
                          {visits.map((v) => (
                            <ScheduleItemRow key={v.id} item={v} onPhotoClick={setLightboxUrl} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-secondary-50">
                    {s.visits.map((v) => (
                      <ScheduleItemRow key={v.id} item={v} onPhotoClick={setLightboxUrl} />
                    ))}
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : null}

      {/* Foto bukti presensi diperbesar */}
      <PhotoLightbox
        url={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
        alt="Foto bukti presensi check-in diperbesar"
      />
    </div>
  )
}
