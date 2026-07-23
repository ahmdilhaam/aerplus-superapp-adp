import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  FileText,
  Eye,
  AlertCircle,
  AlertTriangle,
  MapPin,
  User,
  Calendar,
  Clock,
  Search,
  ChevronDown,
  Download,
} from 'lucide-react'
import type { Column, VisitReportListItem, VisitReportDetail, Outlet } from '../types'
import { getVisitReports, getVisitReport, getOutlets } from '../services/api'
import type { VisitReportsQuery } from '../services/api'
import { DataTable } from '../components/DataTable'
import { Pagination } from '../components/Pagination'
import { Button } from '../components/Button'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { ReportDetailView, statusBadge, allowedStock } from '../components/ReportDetailView'
import { X } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [10, 50, 100]

const failedVisitBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider border border-rose-200">
    <AlertTriangle size={10} />
    Gagal Visit
  </span>
)

// Wide detail modal rendered outside the standard Modal component so we can override max-width
interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string | null
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, reportId }) => {
  const [detail, setDetail] = useState<VisitReportDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !reportId) return
    setDetail(null)
    setError(null)
    setLoading(true)
    getVisitReport(reportId)
      .then((d) => setDetail(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat detail'))
      .finally(() => setLoading(false))
  }, [isOpen, reportId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="relative z-50 bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] w-full max-w-4xl overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-500 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-6 sm:py-8 border-b border-secondary-50 bg-gradient-to-r from-white to-secondary-50/30">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-secondary-900 tracking-tight">Detail Laporan</h2>
            <div className="h-1 w-8 bg-primary-500 rounded-full mt-1" />
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-3 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all duration-300 group"
          >
            <X size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-10 py-6 sm:py-8 max-h-[80vh] overflow-y-auto scrollbar-hide space-y-8">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {detail && <ReportDetailView detail={detail} />}
        </div>
      </div>
    </div>
  )
}

interface OutletSelectProps {
  outlets: Outlet[]
  value: string
  onChange: (name: string) => void
}

const OutletSelect: React.FC<OutletSelectProps> = ({ outlets, value, onChange }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return outlets
    return outlets.filter((o) => o.name.toLowerCase().includes(q))
  }, [outlets, query])

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
        <span className={value ? 'text-secondary-700 truncate' : 'text-secondary-400'}>
          {value || 'Semua Outlet'}
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
                    onChange(o.name)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-primary-50 transition-colors ${
                    value === o.name ? 'bg-primary-50 text-primary-700' : 'text-secondary-700'
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

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<VisitReportListItem[]>([])
  const [totalReports, setTotalReports] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filter states
  const [keyword, setKeyword] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest')
  const [pageSize, setPageSize] = useState(10)

  // Outlet list for the searchable dropdown filter
  const [outlets, setOutlets] = useState<Outlet[]>([])

  // Detail modal state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Download state
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  // Fetch outlet list once for filter dropdown
  useEffect(() => {
    getOutlets()
      .then((rows) => setOutlets(rows))
      .catch(() => setOutlets([]))
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const query: VisitReportsQuery = { sort_by: sortBy, page: currentPage, page_size: pageSize }
      if (keyword) query.keyword = keyword
      if (startDate) query.start_date = startDate
      if (endDate) query.end_date = endDate
      const data = await getVisitReports(query)
      setReports(data.reports || [])
      setTotalReports(data.pagination?.total ?? data.summary?.total_reports ?? (data.reports?.length ?? 0))
      setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports')
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, keyword, startDate, endDate, sortBy])

  // Reset to page 1 whenever a filter changes, so we don't request a page
  // that no longer exists under the new filter.
  useEffect(() => {
    setCurrentPage(1)
  }, [keyword, startDate, endDate, sortBy, pageSize])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleOpenDetail = (id: string) => {
    setSelectedReportId(id)
    setIsDetailOpen(true)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadError(null)
    try {
      // Step 1: fetch ALL matching reports across every server page (max page_size)
      const baseQuery: VisitReportsQuery = { sort_by: sortBy }
      if (keyword) baseQuery.keyword = keyword
      if (startDate) baseQuery.start_date = startDate
      if (endDate) baseQuery.end_date = endDate
      const DOWNLOAD_PAGE_SIZE = 100
      let allReports: VisitReportListItem[] = []
      const first = await getVisitReports({ ...baseQuery, page: 1, page_size: DOWNLOAD_PAGE_SIZE })
      allReports = first.reports || []
      const totalDownloadPages = first.pagination?.totalPages ?? 1
      for (let p = 2; p <= totalDownloadPages; p++) {
        const next = await getVisitReports({ ...baseQuery, page: p, page_size: DOWNLOAD_PAGE_SIZE })
        allReports = allReports.concat(next.reports || [])
      }

      if (allReports.length === 0) {
        alert('Tidak ada laporan yang cocok dengan filter saat ini.')
        return
      }

      // Step 2: fetch detail for every report, in batches of 10
      const BATCH_SIZE = 10
      const details: VisitReportDetail[] = []
      for (let i = 0; i < allReports.length; i += BATCH_SIZE) {
        const batch = allReports.slice(i, i + BATCH_SIZE)
        const batchDetails = await Promise.all(batch.map((r) => getVisitReport(r.id)))
        details.push(...batchDetails)
      }

      // Step 3: map to flat rows
      const rows = details.map((d) => ({
        'ID': d.id,
        'Jenis': d.reportType === 'failed' ? 'Gagal' : 'Biasa',
        'Outlet': d.outlet.name,
        'Alamat': d.outlet.address,
        'Area': d.outlet.area.name,
        'Tanggal Visit': d.visit.date,
        'Jam Visit': d.visit.time,
        'Disubmit': d.visit.submittedAt,
        'Supervisor': d.summary.supervisor.name,
        'Status': d.status.label,
        'Score': d.summary.checklist.score,
        'Checklist Total': d.summary.checklist.total,
        'Checklist Completed': d.summary.checklist.completed,
        'Total Issues': d.summary.issues.total,
        'Issues Checklist': d.summary.issues.checklist,
        'Issues Stock': d.summary.issues.stock,
        'Issues Delivery': d.summary.issues.delivery,
        'Petty Cash': d.laporan.cash.pettyCash ?? '',
        'Cash Drawer': d.laporan.cash.cashDrawer ?? '',
        'Cash POS': d.laporan.cash.pos ?? '',
        'Cash Note': d.laporan.cash.note ?? '',
        'Jumlah Pengantaran': d.laporan.pengantaranGalon.jumlahPengantaranHariIni ?? '',
        'Kendala Pengantaran': d.laporan.pengantaranGalon.kendala.join('; '),
        'Kendala Lainnya': d.laporan.pengantaranGalon.kendalaLainnya ?? '',
        'Pengantaran Note': d.laporan.pengantaranGalon.note ?? '',
        'Stok Bahan Baku': allowedStock(d.laporan.stokBahanBaku)
          .map((s) => `${s.name}: ${s.quantity} (${s.status})`)
          .join('; '),
        'Water pH': d.laporan.kualitasAir.ph ?? '',
        'Water TDS': d.laporan.kualitasAir.tds ?? '',
        'Water Note': d.laporan.kualitasAir.note ?? '',
        'What To Do': d.laporan.whatToDo.join('; '),
        'Approval Status': d.approval?.status ?? '-',
        'Approved By': d.approval?.approvedBy?.name ?? '-',
        'Approved At': d.approval?.approvedAt ?? '-',
        'Approval Note': d.approval?.note ?? '-',
        'Supervisor Area': d.approval?.supervisorArea?.name ?? '-',
      }))

      // Step 4: build workbook and trigger download (lazy-load xlsx to keep main bundle slim)
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Visit Reports')
      const today = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `visit-reports-${today}.xlsx`)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Gagal mengunduh laporan')
    } finally {
      setIsDownloading(false)
    }
  }

  const columns: Column<VisitReportListItem>[] = [
    {
      key: 'outlet',
      header: 'Outlet',
      render: (row) => (
        <div className="flex items-center gap-3">
          <ImageWithFallback
            src={row.outlet.imageUrl}
            alt={row.outlet.name}
            className="w-9 h-9 rounded-lg object-cover border border-secondary-100 shrink-0"
            fallback={
              <div className="w-9 h-9 rounded-lg bg-secondary-100 flex items-center justify-center shrink-0">
                <FileText size={14} className="text-secondary-400" />
              </div>
            }
          />
          <div>
            <p className="font-bold text-secondary-900 text-sm flex items-center gap-2 flex-wrap">
              {row.outlet.name}
              {row.reportType === 'failed' && failedVisitBadge()}
            </p>
            <p className="text-[11px] text-secondary-400 flex items-center gap-1">
              <MapPin size={10} /> {row.outlet.address}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'visit',
      header: 'Tanggal Visit',
      render: (row) => (
        <div className="text-sm">
          <p className="font-bold text-secondary-900 flex items-center gap-1">
            <Calendar size={12} className="text-secondary-400" />
            {row.visit.date}
          </p>
          <p className="text-secondary-400 text-[11px] flex items-center gap-1 mt-0.5">
            <Clock size={10} /> {row.visit.time}
          </p>
        </div>
      ),
    },
    {
      key: 'supervisor',
      header: 'Supervisor',
      render: (row) => (
        <div className="flex items-center gap-1 text-sm text-secondary-700">
          <User size={13} className="text-secondary-400" />
          {row.supervisor.name}
        </div>
      ),
    },
    {
      key: 'checklist',
      header: 'Checklist',
      render: (row) => (
        <span className="text-sm font-bold text-secondary-700">
          {row.checklist.completed}/{row.checklist.total}
        </span>
      ),
    },
    {
      key: 'issues',
      header: 'Issues',
      render: (row) => (
        <span className={`text-sm font-black ${row.issues.total > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {row.issues.total}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => statusBadge(row.status),
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (row) => (
        <button
          onClick={() => handleOpenDetail(row.id)}
          className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200"
          title="Lihat detail"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Reports</h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Daftar laporan kunjungan outlet
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
              {totalReports} total
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            <Download size={16} />
            {isDownloading ? 'Downloading...' : 'Download Excel'}
          </Button>
        </div>
      </div>

      {/* Download error */}
      {downloadError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-red-700 text-sm font-medium">Gagal mengunduh: {downloadError}</p>
          </div>
          <button
            onClick={() => setDownloadError(null)}
            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Outlet (searchable) */}
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Outlet</label>
          <OutletSelect outlets={outlets} value={keyword} onChange={setKeyword} />
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

        {/* Sort */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Urutan</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest')}
            className="px-4 py-3 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700"
          >
            <option value="latest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-24 bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-rose-50/30 opacity-50" />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-lg shadow-rose-200">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2">Reports Error</h4>
            <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px] bg-rose-50 px-4 py-1.5 rounded-full inline-block mb-4">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-32 bg-white rounded-2xl border border-secondary-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="text-center relative z-10">
            <div className="relative mb-6 mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Memuat laporan...</p>
            <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">Please wait a moment</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-secondary-200">
          <div className="w-24 h-24 bg-secondary-50 rounded-2xl flex items-center justify-center mb-6 text-secondary-200 border border-secondary-100">
            <FileText size={40} strokeWidth={1} />
          </div>
          <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Tidak Ada Laporan</p>
          <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">
            {keyword || startDate || endDate ? 'Coba sesuaikan filter pencarian' : 'Belum ada laporan kunjungan'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50 overflow-hidden">
            <DataTable columns={columns} data={reports} />
          </div>

          {reports.length > 0 && (
            <div className="bg-white px-8 py-6 rounded-2xl border border-secondary-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-secondary-500 uppercase tracking-widest">Per page</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1.5 bg-white border border-secondary-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <p className="hidden md:flex text-[11px] font-bold text-secondary-500 uppercase tracking-widest items-center gap-4">
                  <span>Page <span className="text-primary-600 font-black">{currentPage}</span> of <span className="text-secondary-900 font-black">{totalPages}</span></span>
                  <span className="w-1 h-1 bg-secondary-200 rounded-full" />
                  <span><span className="text-primary-600 font-black">{totalReports}</span> Results</span>
                </p>
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <DetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        reportId={selectedReportId}
      />
    </div>
  )
}
