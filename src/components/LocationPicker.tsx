import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker points at PNG assets that don't resolve reliably
// under the bundler (broken-image icon). Use a self-contained inline-SVG
// divIcon so the pin has zero external asset dependency.
const pinIcon = L.divIcon({
  className: 'location-picker-pin',
  html: `<svg width="28" height="40" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24s12-15.75 12-24c0-6.627-5.373-12-12-12z" fill="#4f46e5"/><circle cx="12" cy="12" r="4.5" fill="#ffffff"/></svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
})

const DEFAULT_CENTER: [number, number] = [-6.2, 106.816666] // Jakarta

interface LocationPickerProps {
  lat: number | null
  lng: number | null
  onChange?: (lat: number, lng: number) => void
  height?: number
}

// Recenters the map whenever lat/lng change from outside the map itself
// (e.g. user typing coordinates into the number inputs).
const RecenterOnChange: React.FC<{ lat: number | null; lng: number | null }> = ({ lat, lng }) => {
  const map = useMap()

  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom())
    }
  }, [lat, lng, map])

  return null
}

// Handles map clicks to pick/move the coordinate. Only mounted in edit mode.
const ClickHandler: React.FC<{ onChange: (lat: number, lng: number) => void }> = ({ onChange }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  return null
}

// Forces Leaflet to recompute tile layout once the container has its real
// size (fixes the "grey map" issue when mounted inside a Modal whose
// enter animation/layout isn't settled on first paint).
const InvalidateSizeOnReady: React.FC = () => {
  const map = useMap()

  useEffect(() => {
    const timers = [0, 100, 300].map((delay) =>
      setTimeout(() => map.invalidateSize(), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [map])

  return null
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onChange, height = 240 }) => {
  const hasPoint = lat != null && lng != null
  const center: [number, number] = hasPoint ? [lat, lng] : DEFAULT_CENTER
  const zoom = hasPoint ? 16 : 13
  const mapRef = useRef<L.Map | null>(null)

  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    const marker = e.target as L.Marker
    const position = marker.getLatLng()
    onChange?.(position.lat, position.lng)
  }

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        {hasPoint && (
          <Marker
            position={[lat, lng]}
            icon={pinIcon}
            draggable={!!onChange}
            eventHandlers={onChange ? { dragend: handleMarkerDragEnd } : undefined}
          />
        )}
        {onChange && <ClickHandler onChange={onChange} />}
        <RecenterOnChange lat={lat} lng={lng} />
        <InvalidateSizeOnReady />
      </MapContainer>
    </div>
  )
}
