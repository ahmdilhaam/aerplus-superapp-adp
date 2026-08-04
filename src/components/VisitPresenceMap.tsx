import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { VisitPresence } from '../types'

// Warna pin disamakan dengan ikon check-in/check-out di VisitDetailModal supaya
// legenda peta terbaca tanpa harus dijelaskan ulang.
const OUTLET_COLOR = '#4f46e5'
const CHECKIN_COLOR = '#10b981'
const CHECKOUT_COLOR = '#f59e0b'

// Leaflet's default marker points at PNG assets that don't resolve reliably under
// the bundler. Pakai divIcon inline-SVG seperti LocationPicker — nol aset eksternal.
const pinIcon = (color: string) =>
  L.divIcon({
    className: 'visit-presence-pin',
    html: `<svg width="26" height="37" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24s12-15.75 12-24c0-6.627-5.373-12-12-12z" fill="${color}"/><circle cx="12" cy="12" r="4.5" fill="#ffffff"/></svg>`,
    iconSize: [26, 37],
    iconAnchor: [13, 37],
  })

const outletIcon = pinIcon(OUTLET_COLOR)
const checkinIcon = pinIcon(CHECKIN_COLOR)
const checkoutIcon = pinIcon(CHECKOUT_COLOR)

type Point = { position: [number, number]; label: string; icon: L.DivIcon }

// Merapatkan viewport ke seluruh titik yang ada. Satu titik saja tidak punya
// bounds yang bermakna, jadi di-setView dengan zoom tetap.
const FitToPoints: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap()

  // Titik-titik ini stabil selama modal terbuka; key-nya dipakai agar efek tidak
  // ikut jalan setiap render hanya karena array-nya baru.
  const key = positions.map(([lat, lng]) => `${lat},${lng}`).join('|')

  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 17)
      return
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [32, 32], maxZoom: 17 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map])

  return null
}

// Leaflet menghitung ukuran tile saat mount; di dalam Modal, layout-nya belum
// settle pada paint pertama sehingga peta tampil abu-abu tanpa ini.
const InvalidateSizeOnReady: React.FC = () => {
  const map = useMap()

  useEffect(() => {
    const timers = [0, 100, 300].map((delay) => setTimeout(() => map.invalidateSize(), delay))
    return () => timers.forEach(clearTimeout)
  }, [map])

  return null
}

const LegendDot: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-secondary-500">
    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
    {children}
  </span>
)

export interface VisitPresenceMapProps {
  presence: VisitPresence
  outlet: {
    name: string
    latitude?: number | null
    longitude?: number | null
    checkinRadiusMeters?: number
  } | null
  height?: number
}

/**
 * Peta titik presensi satu kunjungan: posisi outlet (+ radius geofence check-in),
 * titik check-in, dan titik check-out. Dipakai untuk jadwal SPV maupun auditor —
 * keduanya menulis geotag ke kolom yang sama.
 *
 * Mengembalikan null bila tidak ada satu pun koordinat yang bisa digambar, jadi
 * pemanggil tidak perlu mengecek ulang.
 */
export const VisitPresenceMap: React.FC<VisitPresenceMapProps> = ({ presence, outlet, height = 260 }) => {
  const outletPosition: [number, number] | null =
    outlet?.latitude != null && outlet?.longitude != null ? [outlet.latitude, outlet.longitude] : null

  const checkinPosition: [number, number] | null =
    presence.checkinLat != null && presence.checkinLng != null
      ? [presence.checkinLat, presence.checkinLng]
      : null

  const checkoutPosition: [number, number] | null =
    presence.checkoutLat != null && presence.checkoutLng != null
      ? [presence.checkoutLat, presence.checkoutLng]
      : null

  const points: Point[] = []
  if (outletPosition) points.push({ position: outletPosition, label: outlet?.name ?? 'Outlet', icon: outletIcon })
  if (checkinPosition) points.push({ position: checkinPosition, label: 'Titik check-in', icon: checkinIcon })
  if (checkoutPosition) points.push({ position: checkoutPosition, label: 'Titik check-out', icon: checkoutIcon })

  if (points.length === 0) return null

  const radius = outlet?.checkinRadiusMeters
  const positions = points.map((p) => p.position)

  return (
    <div className="space-y-2">
      <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-secondary-200">
        <MapContainer center={positions[0]} zoom={17} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />

          {/* Radius geofence check-in — hanya bisa digambar kalau outlet berkoordinat. */}
          {outletPosition && radius != null && (
            <Circle
              center={outletPosition}
              radius={radius}
              pathOptions={{ color: OUTLET_COLOR, weight: 1, fillColor: OUTLET_COLOR, fillOpacity: 0.08 }}
            />
          )}

          {/* Garis bantu outlet → titik presensi, biar simpangannya langsung terlihat. */}
          {outletPosition && checkinPosition && (
            <Polyline
              positions={[outletPosition, checkinPosition]}
              pathOptions={{ color: CHECKIN_COLOR, weight: 2, dashArray: '4 4', opacity: 0.7 }}
            />
          )}
          {outletPosition && checkoutPosition && (
            <Polyline
              positions={[outletPosition, checkoutPosition]}
              pathOptions={{ color: CHECKOUT_COLOR, weight: 2, dashArray: '4 4', opacity: 0.7 }}
            />
          )}

          {points.map((p) => (
            <Marker key={p.label} position={p.position} icon={p.icon}>
              <Tooltip direction="top" offset={[0, -34]}>
                {p.label}
              </Tooltip>
            </Marker>
          ))}

          <FitToPoints positions={positions} />
          <InvalidateSizeOnReady />
        </MapContainer>
      </div>

      <div className="flex items-center gap-4 flex-wrap px-1">
        {outletPosition && (
          <LegendDot color={OUTLET_COLOR}>
            Outlet{radius != null ? ` (radius ${radius} m)` : ''}
          </LegendDot>
        )}
        {checkinPosition && <LegendDot color={CHECKIN_COLOR}>Check-in</LegendDot>}
        {checkoutPosition && <LegendDot color={CHECKOUT_COLOR}>Check-out</LegendDot>}
      </div>
    </div>
  )
}
