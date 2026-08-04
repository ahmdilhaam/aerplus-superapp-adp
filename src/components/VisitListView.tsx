import { useState } from 'react'
import { Calendar, MapPin, Clock, ChevronDown, User, Clipboard, Sun, ImageOff } from 'lucide-react'
import type { AdminVisitItem, AdminVisitSupervisorGroup } from '../types'
import { formatDateId } from '../utils/visitDate'
import { getStatusVariant } from '../utils/visitStatus'
import { resolveApiFileUrl } from '../utils/image'
import { durationBadge } from '../utils/visitPresence'
import { Badge } from './Badge'
import { ImageWithFallback } from './ImageWithFallback'
import { PhotoLightbox } from './PhotoLightbox'

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
        <p className="font-bold text-secondary-900 text-sm truncate flex items-center gap-2">
          <span className="truncate">{v.outlet?.name}</span>
          {v.source === 'audit' && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border border-slate-200">
              Audit
            </span>
          )}
        </p>
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

interface VisitListViewProps {
  supervisors: AdminVisitSupervisorGroup[]
  /** True when the fetched range spans more than one day — items get date headers. */
  isRange: boolean
}

// Accordion list — one collapsible card per supervisor.
export const VisitListView: React.FC<VisitListViewProps> = ({ supervisors, isRange }) => {
  // Per-supervisor accordion state. Undefined = open by default; toggling stores explicit boolean.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: prev[id] === false ? true : false }))
  // Foto bukti presensi yang sedang diperbesar (null = lightbox tertutup).
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {supervisors.map((s) => (
        <div
          key={s.id}
          className="bg-white rounded-4xl border border-secondary-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50"
        >
          {/* Supervisor header (accordion toggle) */}
          <button
            type="button"
            onClick={() => toggleExpanded(s.id)}
            className={`w-full flex items-center gap-4 px-8 py-6 text-left bg-linear-to-r from-white to-secondary-50/30 transition-colors hover:bg-secondary-50/40 ${expanded[s.id] !== false ? 'border-b border-secondary-50' : ''}`}
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

      {/* Foto bukti presensi diperbesar */}
      <PhotoLightbox
        url={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
        alt="Foto bukti presensi check-in diperbesar"
      />
    </div>
  )
}
