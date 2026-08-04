import { useState } from 'react'
import { MapPin, Clock, User, Clipboard, Sun, ImageOff, AlertTriangle, LogIn, LogOut } from 'lucide-react'
import type { AdminVisitItem, AdminVisitSupervisorGroup } from '../types'
import { formatDateId, formatDateTimeId } from '../utils/visitDate'
import { getStatusVariant } from '../utils/visitStatus'
import { resolveApiFileUrl } from '../utils/image'
import { durationBadge } from '../utils/visitPresence'
import { Badge } from './Badge'
import { ImageWithFallback } from './ImageWithFallback'
import { PhotoLightbox } from './PhotoLightbox'
import { VisitPresenceMap } from './VisitPresenceMap'
import { Modal } from './Modal'

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start gap-2 flex-wrap">
    <span className="text-secondary-400 font-bold w-32 shrink-0 text-sm">{label}</span>
    <span className="text-secondary-900 font-medium text-sm flex items-center gap-2 flex-wrap min-w-0">{children}</span>
  </div>
)

// Satu kartu foto bukti presensi. `url` sudah lewat resolveApiFileUrl; undefined
// berarti SPV belum melakukan tahap itu atau presign gagal di server.
const PresencePhoto: React.FC<{
  label: string
  url: string | undefined
  onOpen: (url: string) => void
}> = ({ label, url, onOpen }) =>
    url ? (
      <button
        type="button"
        onClick={() => onOpen(url)}
        className="group relative aspect-4/3 rounded-xl overflow-hidden border border-secondary-200 hover:ring-2 hover:ring-primary-400 transition-all"
        title={`Lihat foto presensi ${label.toLowerCase()}`}
      >
        <img src={url} alt={`Foto bukti presensi ${label.toLowerCase()}`} className="w-full h-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 bg-gray-900/60 text-white text-[9px] font-black uppercase tracking-widest py-1 text-center">
          {label}
        </span>
      </button>
    ) : (
      <div className="aspect-4/3 rounded-xl bg-secondary-50 border border-dashed border-secondary-200 flex flex-col items-center justify-center gap-1 text-secondary-300">
        <ImageOff size={18} />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        <span className="text-[9px] font-bold">Tidak tersedia</span>
      </div>
    )

// Penanda presensi di luar radius geofence outlet. Jarak null = tak bisa dihitung
// (outlet belum dikoordinatkan), jadi angkanya sengaja tidak ditampilkan.
const GeofenceWarning: React.FC<{ outside?: boolean; distanceMeters?: number | null }> = ({
  outside,
  distanceMeters,
}) =>
  outside ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200">
      <AlertTriangle size={11} />
      {distanceMeters != null ? `Di luar radius · ${distanceMeters} m` : 'Di luar radius'}
    </span>
  ) : null

interface VisitDetailModalProps {
  /** Item yang sedang dibuka; null = modal tertutup. */
  item: AdminVisitItem | null
  /** Supervisor pemilik jadwal, untuk konteks di header modal. */
  supervisor: AdminVisitSupervisorGroup | null
  onClose: () => void
}

// Detail satu item jadwal (visit/agenda/libur) beserta data presensi apa adanya
// dari response admin visit schedule — tidak ada request tambahan ke API.
export const VisitDetailModal: React.FC<VisitDetailModalProps> = ({ item: v, supervisor, onClose }) => {
  // Foto bukti presensi yang sedang diperbesar (null = lightbox tertutup).
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  if (!v) return null

  const checkinPhotoUrl = resolveApiFileUrl(v.presence?.checkinPhotoUrl)
  const checkoutPhotoUrl = resolveApiFileUrl(v.presence?.checkoutPhotoUrl)
  const duration = durationBadge(v.presence?.durationMinutes)
  // Label baris mengikuti jalur kunjungan — jadwal audit dikerjakan auditor,
  // bukan supervisor. Agenda & libur selalu domain supervisor.
  const roleLabel = v.source === 'audit' ? 'Auditor' : 'Supervisor'
  // `supervisor.role` dari backend berbentuk "<peran> <area>" (area bisa kosong).
  // Buang bagian perannya karena sudah jadi label baris, sisakan areanya saja
  // supaya tidak terbaca "Supervisor: Nama AUDITOR".
  const areaSuffix = supervisor?.role?.startsWith(roleLabel)
    ? supervisor.role.slice(roleLabel.length).trim()
    : (supervisor?.role ?? '')
  // Peta hanya berarti kalau ada geotag presensi; koordinat outlet saja tidak
  // menceritakan apa pun soal presensi (dan jadwal lama belum punya geotag).
  const hasPresenceLocation =
    (v.presence?.checkinLat != null && v.presence?.checkinLng != null) ||
    (v.presence?.checkoutLat != null && v.presence?.checkoutLng != null)

  const heading =
    v.type === 'visit' ? (v.outlet?.name ?? '-') : v.type === 'agenda' ? (v.title ?? 'Agenda') : (v.name ?? 'Libur')

  return (
    <>
      <Modal isOpen onClose={onClose} title="Detail Jadwal" maxWidthClassName="max-w-xl">
        <div className="space-y-6">
          {/* Judul item + status */}
          <div className="flex items-start gap-4">
            {v.type === 'visit' ? (
              <ImageWithFallback
                src={v.outlet?.imageUrl}
                alt={v.outlet?.name ?? ''}
                className="w-14 h-14 rounded-2xl object-cover border border-secondary-100 shrink-0"
                fallback={
                  <div className="w-14 h-14 rounded-2xl bg-secondary-100 flex items-center justify-center shrink-0">
                    <MapPin size={20} className="text-secondary-400" />
                  </div>
                }
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${v.type === 'agenda' ? 'bg-violet-50 border-violet-100' : 'bg-rose-50 border-rose-100'
                  }`}
              >
                {v.type === 'agenda' ? (
                  <Clipboard size={20} className="text-violet-500" />
                ) : (
                  <Sun size={20} className="text-rose-500" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-secondary-900 tracking-tight">{heading}</h3>
              {v.type === 'visit' && v.outlet?.address && (
                <p className="text-xs text-secondary-400 font-medium flex items-start gap-1 mt-1">
                  <MapPin size={12} className="shrink-0 mt-0.5" />
                  <span>{v.outlet.address}</span>
                </p>
              )}
              {v.type === 'agenda' && <p className="text-xs text-secondary-400 font-medium mt-1">{v.note || 'Jadwal lainnya'}</p>}
              {v.type === 'libur' && <p className="text-xs text-secondary-400 font-medium mt-1">Hari libur</p>}
            </div>
            <Badge variant={getStatusVariant(v.statusCode)} label={v.status} />
          </div>

          {/* Jadwal */}
          <div className="p-4 bg-secondary-50/60 border border-secondary-100 rounded-2xl space-y-2">
            {supervisor && (
              <Row label={roleLabel}>
                <ImageWithFallback
                  src={supervisor.avatarUrl}
                  alt={supervisor.name}
                  className="w-6 h-6 rounded-lg object-cover border border-secondary-200 shrink-0"
                  fallback={
                    <div className="w-6 h-6 rounded-lg bg-secondary-100 flex items-center justify-center shrink-0">
                      <User size={12} className="text-secondary-400" />
                    </div>
                  }
                />
                <span>
                  {supervisor.name}
                  {areaSuffix && (
                    <span className="text-secondary-400 font-bold text-[10px] uppercase tracking-widest ml-2">
                      {areaSuffix}
                    </span>
                  )}
                </span>
              </Row>
            )}
            <Row label="Tanggal">{formatDateId(v.date)}</Row>
            <Row label="Jam Jadwal">
              {v.time ? (
                <>
                  <Clock size={13} className="text-secondary-400" />
                  {v.time}
                  {v.endTime && (
                    <>
                      <span className="text-secondary-400"> - </span>
                      <Clock size={13} className="text-secondary-400" />
                      {v.endTime}
                    </>
                  )}
                </>
              ) : (
                <span className="text-secondary-300">-</span>
              )}
            </Row>
          </div>

          {/* Presensi — hanya relevan untuk item visit */}
          {v.type === 'visit' && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-2 ml-1">Presensi</p>
              {v.presence?.checkinAt ? (
                <div className="p-4 bg-white border border-secondary-100 rounded-2xl space-y-2">
                  <Row label="Check-in">
                    <LogIn size={13} className="text-emerald-500" />
                    {formatDateTimeId(v.presence.checkinAt)}
                    {v.presence.isLate && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-200">
                        <AlertTriangle size={11} />
                        Telat
                      </span>
                    )}
                    <GeofenceWarning
                      outside={v.presence.checkinOutsideGeofence}
                      distanceMeters={v.presence.checkinDistanceMeters}
                    />
                  </Row>
                  <Row label="Check-out">
                    <LogOut size={13} className="text-secondary-400" />
                    {formatDateTimeId(v.presence.checkoutAt)}
                    {v.presence.checkoutAt && (
                      <GeofenceWarning
                        outside={v.presence.checkoutOutsideGeofence}
                        distanceMeters={v.presence.checkoutDistanceMeters}
                      />
                    )}
                  </Row>
                  <Row label="Durasi">
                    {duration ? <Badge variant={duration.variant} label={duration.label} /> : <span className="text-secondary-300">-</span>}
                  </Row>
                  <div className="pt-1">
                    <p className="text-secondary-400 font-bold text-sm mb-2">Foto Presensi</p>
                    <div className="grid grid-cols-2 gap-3">
                      <PresencePhoto label="Check-in" url={checkinPhotoUrl} onOpen={setLightboxUrl} />
                      <PresencePhoto label="Check-out" url={checkoutPhotoUrl} onOpen={setLightboxUrl} />
                    </div>
                  </div>
                  <div className="pt-1">
                    <p className="text-secondary-400 font-bold text-sm mb-2">Lokasi Presensi</p>
                    {hasPresenceLocation ? (
                      <VisitPresenceMap presence={v.presence} outlet={v.outlet} />
                    ) : (
                      <div className="p-3 rounded-xl bg-secondary-50 border border-dashed border-secondary-200 text-center">
                        <p className="text-secondary-400 text-[11px] font-bold">
                          Titik lokasi presensi tidak tersedia untuk kunjungan ini
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-secondary-50 border border-dashed border-secondary-200 rounded-2xl text-center">
                  <p className="text-secondary-400 text-xs font-bold">Supervisor belum check-in di outlet ini</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Foto bukti presensi diperbesar */}
      <PhotoLightbox
        url={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
        alt="Foto bukti presensi check-in diperbesar"
      />
    </>
  )
}
