import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface PhotoLightboxProps {
  /** URL foto yang ditampilkan; null = lightbox tertutup. */
  url: string | null
  onClose: () => void
  alt?: string
}

// Overlay foto diperbesar. Diekstrak dari ReportDetailView agar dipakai bersama
// oleh detail laporan (foto audit + foto presensi) dan jadwal visit admin (foto
// presensi), sehingga perilaku tutup/escape konsisten di semua tempat.
export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ url, onClose, alt = 'Foto diperbesar' }) => {
  useEffect(() => {
    if (!url) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [url, onClose])

  if (!url) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-6"
      onClick={onClose}
      role="button"
      tabIndex={-1}
    >
      <img
        src={url}
        alt={alt}
        className="max-w-full max-h-full rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
        aria-label="Tutup foto"
      >
        <X size={22} strokeWidth={3} />
      </button>
    </div>
  )
}
