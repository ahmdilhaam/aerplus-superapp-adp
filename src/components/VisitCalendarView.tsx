import { useState } from 'react'
import { MapPin, User, Clipboard, Sun } from 'lucide-react'
import type { AdminVisitItem, AdminVisitSupervisorGroup } from '../types'
import { DAY_LABELS, dayNum, shortMonth } from '../utils/visitDate'
import { getStatusVariant } from '../utils/visitStatus'
import { ImageWithFallback } from './ImageWithFallback'
import { VisitDetailModal } from './VisitDetailModal'

// Compact variant of ScheduleItemRow used inside the weekly calendar cells.
const CALENDAR_TONE: Record<string, string> = {
  success: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  warning: 'bg-amber-50 border-amber-100 text-amber-700',
  error: 'bg-rose-50 border-rose-100 text-rose-700',
  info: 'bg-sky-50 border-sky-100 text-sky-700',
}

const CHIP_BASE =
  'w-full text-left rounded-xl border px-2.5 py-2 cursor-pointer transition-all hover:ring-2 hover:ring-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400'

const CalendarItemChip: React.FC<{ item: AdminVisitItem; onClick: () => void }> = ({ item: v, onClick }) => {
  if (v.type === 'libur') {
    return (
      <button type="button" onClick={onClick} title="Lihat detail" className={`${CHIP_BASE} bg-rose-50 border-rose-100`}>
        <p className="text-[10px] font-black text-rose-600 truncate flex items-center gap-1">
          <Sun size={10} className="shrink-0" />
          {v.name || 'Libur'}
        </p>
      </button>
    )
  }

  if (v.type === 'agenda') {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Lihat detail"
        className={`${CHIP_BASE} bg-violet-50 border-violet-100`}
      >
        <p className="text-[10px] font-black text-violet-700 truncate flex items-center gap-1">
          <Clipboard size={10} className="shrink-0" />
          {v.title || 'Agenda'}
        </p>
        {v.time && <p className="text-[9px] font-bold text-violet-400 mt-0.5">{v.time}</p>}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Lihat detail presensi"
      className={`${CHIP_BASE} ${CALENDAR_TONE[getStatusVariant(v.statusCode)]}`}
    >
      <p className="text-[10px] font-black truncate flex items-center gap-1">
        <MapPin size={10} className="shrink-0" />
        {v.outlet?.name || '-'}
        {/* Penanda telat dibiarkan sekecil mungkin agar chip tetap muat di kolom hari */}
        {v.presence?.isLate && <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500" />}
      </p>
      <p className="text-[9px] font-bold opacity-60 mt-0.5 truncate">
        {v.time ? `${v.time} · ` : ''}
        {v.status}
      </p>
    </button>
  )
}

interface VisitCalendarViewProps {
  supervisors: AdminVisitSupervisorGroup[]
  /** The 7 ISO dates of the week, Monday first. */
  weekDays: string[]
  /** Today's ISO date, used to highlight the current column. */
  today: string
}

// Weekly calendar — supervisors as rows, Senin–Minggu as columns.
export const VisitCalendarView: React.FC<VisitCalendarViewProps> = ({ supervisors, weekDays, today }) => {
  // Item yang detailnya sedang dibuka (null = modal tertutup). Supervisor ikut
  // disimpan karena chip berada di dalam baris supervisor, bukan di item-nya.
  const [selected, setSelected] = useState<{ item: AdminVisitItem; supervisor: AdminVisitSupervisorGroup } | null>(
    null,
  )

  return (
    <>
      <div className="bg-white rounded-4xl border border-secondary-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-250">
            {/* Day header */}
            <div className="grid grid-cols-[200px_repeat(7,minmax(0,1fr))] border-b border-secondary-100 bg-secondary-50/60">
              <div className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-400 flex items-center">
                Supervisor
              </div>
              {weekDays.map((d, i) => {
                const isToday = d === today
                return (
                  <div
                    key={d}
                    className={`px-3 py-4 text-center border-l border-secondary-100 ${isToday ? 'bg-primary-50' : ''}`}
                  >
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-primary-600' : 'text-secondary-400'
                        }`}
                    >
                      {DAY_LABELS[i]}
                    </p>
                    <p
                      className={`text-lg font-black tracking-tight mt-0.5 ${isToday ? 'text-primary-700' : 'text-secondary-800'
                        }`}
                    >
                      {dayNum(d)}
                    </p>
                    <p className="text-[9px] font-bold text-secondary-300 uppercase">{shortMonth(d)}</p>
                  </div>
                )
              })}
            </div>

            {/* Supervisor rows */}
            {supervisors.map((s) => {
              const byDate = new Map<string, AdminVisitItem[]>()
              for (const v of s.visits) {
                const arr = byDate.get(v.date)
                if (arr) arr.push(v)
                else byDate.set(v.date, [v])
              }
              return (
                <div
                  key={s.id}
                  className="grid grid-cols-[200px_repeat(7,minmax(0,1fr))] border-b border-secondary-50 last:border-b-0 hover:bg-secondary-50/20 transition-colors"
                >
                  <div className="px-6 py-4 flex items-center gap-3 min-w-0">
                    <ImageWithFallback
                      src={s.avatarUrl}
                      alt={s.name}
                      className="w-9 h-9 rounded-xl object-cover border border-secondary-200 shrink-0"
                      fallback={
                        <div className="w-9 h-9 rounded-xl bg-secondary-100 flex items-center justify-center shrink-0">
                          <User size={16} className="text-secondary-400" />
                        </div>
                      }
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-secondary-900 truncate">{s.name}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-secondary-400 truncate">
                        {s.role}
                      </p>
                    </div>
                  </div>
                  {weekDays.map((d) => {
                    const items = byDate.get(d) ?? []
                    return (
                      <div
                        key={d}
                        className={`px-2 py-3 border-l border-secondary-100 space-y-1.5 align-top ${d === today ? 'bg-primary-50/30' : ''
                          }`}
                      >
                        {items.length === 0 ? (
                          <div className="h-full min-h-10 flex items-center justify-center">
                            <span className="text-[10px] text-secondary-200 font-bold">–</span>
                          </div>
                        ) : (
                          items.map((v) => (
                            <CalendarItemChip
                              key={v.id}
                              item={v}
                              onClick={() => setSelected({ item: v, supervisor: s })}
                            />
                          ))
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <VisitDetailModal
        item={selected?.item ?? null}
        supervisor={selected?.supervisor ?? null}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
