import { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  MapPin,
  User,
  Calendar,
  Clock,
  ImageOff,
  ClipboardList,
} from 'lucide-react'
import type { VisitReportDetail, ChecklistItemPhoto } from '../types'
import { ImageWithFallback } from './ImageWithFallback'
import { PhotoLightbox } from './PhotoLightbox'
import { Badge } from './Badge'
import { resolveApiFileUrl } from '../utils/image'
import { durationBadge } from '../utils/visitPresence'

export const formatRupiah = (n: number | null): string =>
  n === null ? '-' : `Rp ${n.toLocaleString('id-ID')}`

// Full date + time, id-ID locale — dipakai untuk jam presensi, submit & approve.
export const formatDateTime = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'

// Hanya item stok ini yang ditampilkan/diekspor di laporan visit (selaras dengan
// whitelist backend di src/lib/stockWhitelist.ts). Match case-insensitive
// "contains"; galon hanya yang "galon kosong" / "galon rusak".
const STOCK_ITEM_KEYWORDS = ['tutup', 'tissue', 'tag', 'galon kosong', 'galon rusak']
export const allowedStock = (items: VisitReportDetail['laporan']['stokBahanBaku']) =>
  items.filter((s) => {
    const lower = s.name.toLowerCase()
    return STOCK_ITEM_KEYWORDS.some((kw) => lower.includes(kw))
  })

export const statusBadge = (status: string) => {
  if (status === 'approved')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200">
        <CheckCircle2 size={11} />
        Approved
      </span>
    )
  if (status === 'rejected')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-200">
        <XCircle size={11} />
        Rejected
      </span>
    )
  if (status === 'submitted')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-50 text-sky-600 border border-sky-200">
        <CheckCircle2 size={11} />
        Terkirim
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200">
      <AlertCircle size={11} />
      Pending
    </span>
  )
}

// Galeri foto bukti (audit-only) — dipakai untuk item checklist maupun section
// laporan. Klik thumbnail → lightbox (via onOpen). Null bila tak ada foto.
const PhotoThumbs: React.FC<{
  photos?: ChecklistItemPhoto[]
  onOpen: (url: string) => void
}> = ({ photos, onOpen }) => {
  if (!photos || photos.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {photos.map((photo, pi) => {
        const url = resolveApiFileUrl(photo.url)
        return url ? (
          <button
            key={pi}
            type="button"
            onClick={() => onOpen(url)}
            className="w-14 h-14 rounded-lg overflow-hidden border border-secondary-200 hover:ring-2 hover:ring-primary-400 transition-all shrink-0"
            title="Lihat foto"
          >
            <img src={url} alt="Bukti foto audit" className="w-full h-full object-cover" />
          </button>
        ) : (
          <div
            key={pi}
            className="w-14 h-14 rounded-lg bg-secondary-100 border border-dashed border-secondary-200 flex items-center justify-center text-secondary-300 shrink-0"
            title="Foto tidak tersedia"
          >
            <ImageOff size={16} />
          </div>
        )
      })}
    </div>
  )
}

// Checklist section (kategori collapsible + foto bukti) sebagai komponen
// terpisah agar Audit.tsx bisa merendernya di baris grid sendiri — sejajar
// antara kolom audit dan kolom SPV pembanding meski tinggi laporan beda.
export const ReportChecklist: React.FC<{ detail: VisitReportDetail }> = ({ detail }) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const toggleCategory = (name: string) =>
    setOpenCategories((prev) => ({ ...prev, [name]: !prev[name] }))

  return (
    <section>
      <h4 className="text-base font-black text-secondary-900 uppercase tracking-widest mb-4 flex items-center gap-2">
        <CheckCircle2 size={16} className="text-primary-500" /> Checklist
        <span className="text-xs font-bold text-secondary-400 normal-case tracking-normal">
          {detail.checklist.summary.completed}/{detail.checklist.summary.total} selesai
        </span>
      </h4>
      <div className="space-y-3">
        {detail.checklist.categories.map((cat) => (
          <div key={cat.name} className="border border-secondary-100 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleCategory(cat.name)}
              className="w-full flex items-center justify-between px-5 py-4 bg-secondary-50 hover:bg-secondary-100 transition-colors text-left"
            >
              <span className="text-sm font-black text-secondary-900">{cat.name}</span>
              <span className="text-xs font-bold text-secondary-400">{openCategories[cat.name] ? '▲' : '▼'}</span>
            </button>
            {openCategories[cat.name] && (
              <div className="divide-y divide-secondary-50">
                {cat.sections.map((sec) => (
                  <div key={sec.name} className="px-5 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-2">{sec.name}</p>
                    <div className="space-y-2">
                      {sec.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          {item.answer ? (
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-secondary-800">{item.question}</p>
                            {item.note && (
                              <p className="text-xs text-secondary-400 italic mt-0.5">{item.note}</p>
                            )}
                            <PhotoThumbs photos={item.photos} onOpen={setLightboxUrl} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} alt="Bukti foto diperbesar" />
    </section>
  )
}

// Section 3 (F16 v1.5): "What To Do" + catatan audit, dirender SETELAH checklist.
// Dipisah dari blok Laporan mengikuti pola ReportChecklist: di tampilan side-by-side
// Audit.tsx, checklist punya baris grid sendiri, jadi section ini harus ikut turun
// agar urutan laporan → checklist → tindakan tetap terjaga di kedua tampilan.
export const ReportActionNotes: React.FC<{ detail: VisitReportDetail }> = ({ detail }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  // Judul disuplai backend per role (`laporan.whatToDoLabel`). Fallback ke `source`
  // bila backend belum diperbarui, lalu ke label SPV — jangan hardcode satu label.
  const label =
    detail.laporan.whatToDoLabel ??
    (detail.source === 'audit' ? 'Rekomendasi Tindakan' : 'Tindakan Wajib')
  const auditNotes = detail.laporan.auditNotes ?? []

  return (
    <section>
      <h4 className="text-base font-black text-secondary-900 uppercase tracking-widest mb-4 flex items-center gap-2">
        <ClipboardList size={16} className="text-primary-500" /> {label}
      </h4>
      <div className="space-y-4">
        <div className="p-4 bg-white border border-secondary-100 rounded-xl">
          {detail.laporan.whatToDo.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-secondary-700 space-y-1">
              {detail.laporan.whatToDo.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-secondary-300 font-medium">—</p>
          )}
          <PhotoThumbs photos={detail.laporanPhotos?.whatToDo} onOpen={setLightboxUrl} />
        </div>

        {/* Catatan Audit — audit-only (v1.4): multi-section (title + body + foto ≤3) */}
        {auditNotes.length > 0 && (
          <div className="p-4 bg-white border border-secondary-100 rounded-xl">
            <p className="text-xs font-black uppercase tracking-widest text-secondary-500 mb-3">Catatan Audit</p>
            <div className="space-y-3">
              {auditNotes.map((note) => (
                <div key={note.key} className="p-3 bg-secondary-50 rounded-lg border border-secondary-100">
                  <p className="text-sm font-bold text-secondary-900">{note.title}</p>
                  {note.body && (
                    <p className="text-sm text-secondary-700 whitespace-pre-line mt-1">{note.body}</p>
                  )}
                  <PhotoThumbs photos={note.photos} onOpen={setLightboxUrl} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} alt="Bukti foto diperbesar" />
    </section>
  )
}

interface ReportDetailViewProps {
  detail: VisitReportDetail
  // Sembunyikan section checklist — dipakai Audit.tsx yang merender
  // <ReportChecklist> terpisah di baris grid berikutnya agar sejajar.
  hideChecklist?: boolean
}

// Full rendering of a single visit report (SPV or audit): outlet header, visit
// info, summary cards, laporan sections, approval, checklist. Shared between
// Reports.tsx's detail modal and Audit.tsx's side-by-side comparison view.
// Checklist items that carry `photos` (audit reports only) render a thumbnail
// gallery with a click-to-enlarge lightbox.
export const ReportDetailView: React.FC<ReportDetailViewProps> = ({ detail, hideChecklist }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Outlet header */}
      <div className="flex items-start gap-4 p-5 bg-secondary-50 rounded-2xl border border-secondary-100">
        <ImageWithFallback
          src={detail.outlet.imageUrl}
          alt={detail.outlet.name}
          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-secondary-200"
          fallback={
            <div className="w-16 h-16 rounded-xl bg-secondary-200 flex items-center justify-center shrink-0">
              <FileText size={24} className="text-secondary-400" />
            </div>
          }
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="text-lg font-black text-secondary-900 tracking-tight">{detail.outlet.name}</h3>
            {statusBadge(detail.status.code)}
          </div>
          <p className="text-sm text-secondary-500 mt-1 flex items-center gap-1">
            <MapPin size={13} /> {detail.outlet.address}
          </p>
          <p className="text-xs text-secondary-400 mt-0.5">Area: {detail.outlet.area.name}</p>
        </div>
      </div>

      {/* Failed visit banner — laporan gagal visit (tidak sempat visit outlet) */}
      {detail.reportType === 'failed' && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertTriangle className="text-rose-600 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-rose-700 font-black uppercase tracking-widest text-xs">Gagal Visit</p>
            <p className="text-rose-600 text-sm mt-1">
              {detail.failedReason || 'Tidak ada alasan yang dicatat.'}
            </p>
          </div>
        </div>
      )}

      {/* Visit info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-secondary-100 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-1 flex items-center gap-1"><Calendar size={10} /> Tanggal</p>
          <p className="text-sm font-bold text-secondary-900">{detail.visit.displayDate || detail.visit.date}</p>
        </div>
        <div className="p-4 bg-white border border-secondary-100 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-1 flex items-center gap-1"><Clock size={10} /> Waktu</p>
          <p className="text-sm font-bold text-secondary-900">{detail.visit.time}</p>
        </div>
        <div className="p-4 bg-white border border-secondary-100 rounded-xl col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-1 flex items-center gap-1"><User size={10} /> Supervisor</p>
          <p className="text-sm font-bold text-secondary-900">{detail.summary.supervisor.name}</p>
        </div>
      </div>

      {/* Presensi & waktu — jam check-in/checkout, durasi kunjungan & jam submit SPV */}
      <section>
        <h4 className="text-base font-black text-secondary-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Clock size={16} className="text-primary-500" /> Presensi & Waktu
        </h4>
        <div className="p-4 bg-white border border-secondary-100 rounded-xl space-y-2 text-sm">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-secondary-400 font-bold w-36 shrink-0">Check-in</span>
            <span className="text-secondary-900 font-medium flex items-center gap-2 flex-wrap">
              {formatDateTime(detail.presence.checkinAt)}
              {detail.presence.isLate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle size={11} />
                  Telat
                </span>
              )}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-secondary-400 font-bold w-36 shrink-0">Check-out</span>
            <span className="text-secondary-900 font-medium">{formatDateTime(detail.presence.checkoutAt)}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-secondary-400 font-bold w-36 shrink-0">Durasi Kunjungan</span>
            {(() => {
              const db = durationBadge(detail.presence.durationMinutes)
              return db ? (
                <Badge variant={db.variant} label={db.label} />
              ) : (
                <span className="text-secondary-300 font-medium">-</span>
              )
            })()}
          </div>
          <div className="flex items-start gap-2">
            <span className="text-secondary-400 font-bold w-36 shrink-0">Disubmit SPV</span>
            <span className="text-secondary-900 font-medium">{formatDateTime(detail.visit.submittedAt)}</span>
          </div>
          {/* Foto bukti presensi — hanya ada bila SPV sudah check-in. */}
          {detail.presence.checkinAt && (
            <div className="flex items-start gap-2">
              <span className="text-secondary-400 font-bold w-36 shrink-0">Foto Presensi</span>
              {(() => {
                const url = resolveApiFileUrl(detail.presence.checkinPhotoUrl)
                return url ? (
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(url)}
                    className="w-14 h-14 rounded-lg overflow-hidden border border-secondary-200 hover:ring-2 hover:ring-primary-400 transition-all shrink-0"
                    title="Lihat foto presensi"
                  >
                    <img src={url} alt="Foto bukti presensi check-in" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div
                    className="w-14 h-14 rounded-lg bg-secondary-100 border border-dashed border-secondary-200 flex items-center justify-center text-secondary-300 shrink-0"
                    title="Foto tidak tersedia"
                  >
                    <ImageOff size={16} />
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Checklist', value: detail.summary.checklist.total, color: 'blue' },
          { label: 'Score', value: `${detail.summary.checklist.score}%`, color: 'emerald' },
          { label: 'Total Issues', value: detail.summary.issues.total, color: detail.summary.issues.total > 0 ? 'rose' : 'emerald' },
          { label: 'Stock Issues', value: detail.summary.issues.stock, color: detail.summary.issues.stock > 0 ? 'amber' : 'emerald' },
        ].map((card) => (
          <div key={card.label} className="p-4 bg-white border border-secondary-100 rounded-xl text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-1">{card.label}</p>
            <p className={`text-2xl font-black ${card.color === 'rose' ? 'text-rose-600' : card.color === 'amber' ? 'text-amber-600' : card.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Laporan section */}
      <section>
        <h4 className="text-base font-black text-secondary-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FileText size={16} className="text-primary-500" /> Laporan
        </h4>

        <div className="space-y-4">
          {/* Cash */}
          <div className="p-4 bg-white border border-secondary-100 rounded-xl">
            <p className="text-xs font-black uppercase tracking-widest text-secondary-500 mb-3">Kas</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                { label: 'Petty Cash', val: detail.laporan.cash.pettyCash },
                { label: 'Cash Drawer', val: detail.laporan.cash.cashDrawer },
                { label: 'Input SPV', val: detail.laporan.cash.inputSpv },
                { label: 'POS Calculated', val: detail.laporan.cash.pos },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-secondary-400 font-bold">{item.label}</p>
                  <p className="font-bold text-secondary-900">{formatRupiah(item.val)}</p>
                </div>
              ))}
            </div>
            {detail.laporan.cash.note && (
              <p className="mt-2 text-xs text-secondary-500 italic border-t border-secondary-100 pt-2">{detail.laporan.cash.note}</p>
            )}
            <PhotoThumbs photos={detail.laporanPhotos?.cash} onOpen={setLightboxUrl} />
          </div>

          {/* Pengantaran Galon */}
          <div className="p-4 bg-white border border-secondary-100 rounded-xl">
            <p className="text-xs font-black uppercase tracking-widest text-secondary-500 mb-3">Pengantaran Galon</p>
            {/* F16 v1.5 — dua angka terpisah: transaksi vs galon. `-` berarti tidak
                dicatat (laporan sebelum kolom qty ada), sengaja bukan 0. */}
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-[10px] text-secondary-400 font-bold">Jumlah Transaksi</p>
                <p className="font-bold text-secondary-900">
                  {detail.laporan.pengantaranGalon.jumlahPengantaranHariIni ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-secondary-400 font-bold">Qty Galon</p>
                <p className="font-bold text-secondary-900">
                  {detail.laporan.pengantaranGalon.qtyPengantaranHariIni ?? '-'}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-secondary-500">Kendala:</p>
              {detail.laporan.pengantaranGalon.kendala.length > 0 || detail.laporan.pengantaranGalon.kendalaLainnya ? (
                <ul className="list-disc list-inside text-sm text-secondary-700 mt-1 space-y-0.5">
                  {detail.laporan.pengantaranGalon.kendala.map((k, i) => <li key={i}>{k}</li>)}
                  {detail.laporan.pengantaranGalon.kendalaLainnya && (
                    <li>{detail.laporan.pengantaranGalon.kendalaLainnya}</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-secondary-300 font-medium mt-1">—</p>
              )}
            </div>
            {detail.laporan.pengantaranGalon.note && (
              <p className="mt-2 text-xs text-secondary-500 italic border-t border-secondary-100 pt-2">{detail.laporan.pengantaranGalon.note}</p>
            )}
            <PhotoThumbs photos={detail.laporanPhotos?.pengantaranGalon} onOpen={setLightboxUrl} />
          </div>

          {/* Stok Bahan Baku */}
          <div className="p-4 bg-white border border-secondary-100 rounded-xl">
            <p className="text-xs font-black uppercase tracking-widest text-secondary-500 mb-3">Stok Bahan Baku</p>
            {allowedStock(detail.laporan.stokBahanBaku).length > 0 ? (
              <div className="space-y-2">
                {allowedStock(detail.laporan.stokBahanBaku).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-secondary-900 font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-secondary-700">{item.quantity}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        item.status === 'safe' ? 'bg-emerald-50 text-emerald-600' :
                        item.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary-300 font-medium">—</p>
            )}
            <PhotoThumbs photos={detail.laporanPhotos?.stokBahanBaku} onOpen={setLightboxUrl} />
          </div>

          {/* Kualitas Air */}
          <div className="p-4 bg-white border border-secondary-100 rounded-xl">
            <p className="text-xs font-black uppercase tracking-widest text-secondary-500 mb-3">Kualitas Air</p>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-[10px] text-secondary-400 font-bold">pH</p>
                <p className="font-bold text-secondary-900">{detail.laporan.kualitasAir.ph ?? '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-secondary-400 font-bold">TDS</p>
                <p className="font-bold text-secondary-900">{detail.laporan.kualitasAir.tds ?? '-'}</p>
              </div>
            </div>
            {detail.laporan.kualitasAir.note && (
              <p className="mt-2 text-xs text-secondary-500 italic border-t border-secondary-100 pt-2">{detail.laporan.kualitasAir.note}</p>
            )}
            <PhotoThumbs photos={detail.laporanPhotos?.kualitasAir} onOpen={setLightboxUrl} />
          </div>

          {/* What To Do + Catatan Audit pindah ke <ReportActionNotes> (section 3,
              setelah checklist) — F16 v1.5. */}
        </div>
      </section>

      {/* Checklist section — dipisah agar Audit.tsx bisa merendernya sejajar */}
      {!hideChecklist && <ReportChecklist detail={detail} />}

      {/* Section 3 (F16 v1.5) — tepat setelah checklist. Saat checklist di-hoist
          keluar (hideChecklist, tampilan side-by-side), section ini ikut di-hoist
          oleh pemanggil agar tidak mendahului checklist. */}
      {!hideChecklist && <ReportActionNotes detail={detail} />}

      {/* Approval section — SPV only; laporan audit tidak melalui approval */}
      {detail.approval && (
      <section>
        <h4 className="text-base font-black text-secondary-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-primary-500" /> Approval
        </h4>
        <div className="p-4 bg-white border border-secondary-100 rounded-xl space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-secondary-400 font-bold w-32 shrink-0">Status</span>
            {statusBadge(detail.approval.status)}
          </div>
          <div className="flex items-start gap-2">
            <span className="text-secondary-400 font-bold w-32 shrink-0">Supervisor</span>
            <span className="text-secondary-900 font-medium">{detail.approval.supervisor.name}</span>
          </div>
          {detail.approval.approvedBy && (
            <div className="flex items-start gap-2">
              <span className="text-secondary-400 font-bold w-32 shrink-0">Disetujui Oleh</span>
              <span className="text-secondary-900 font-medium">
                {detail.approval.approvedBy.name}
                {detail.approval.approvedAt && (
                  <span className="text-secondary-400 ml-1">
                    ({formatDateTime(detail.approval.approvedAt)})
                  </span>
                )}
              </span>
            </div>
          )}
          {detail.approval.note && (
            <div className="flex items-start gap-2">
              <span className="text-secondary-400 font-bold w-32 shrink-0">Catatan</span>
              <span className="text-secondary-700 italic">{detail.approval.note}</span>
            </div>
          )}
          {detail.approval.reply && (
            <div className="flex items-start gap-2">
              <span className="text-secondary-400 font-bold w-32 shrink-0">Balasan SPV</span>
              <span className="text-secondary-700 italic">
                {detail.approval.reply.note}
                {detail.approval.reply.repliedAt && (
                  <span className="text-secondary-400 not-italic ml-1">
                    ({formatDateTime(detail.approval.reply.repliedAt)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Photo lightbox */}
      <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} alt="Bukti foto diperbesar" />
    </div>
  )
}
