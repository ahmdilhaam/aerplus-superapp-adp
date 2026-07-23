import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Eye,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  GitCompare,
  X,
} from 'lucide-react'
import type { Column, AuditReportListItem, AuditReportDetailResponse } from '../types'
import { getAuditReports, getAuditReport } from '../services/api'
import type { AuditReportsQuery } from '../services/api'
import { DataTable } from '../components/DataTable'
import { Pagination } from '../components/Pagination'
import { ReportDetailView, ReportChecklist, statusBadge } from '../components/ReportDetailView'

const PAGE_SIZE_OPTIONS = [10, 50, 100]

const comparisonBadge = (hasComparison: boolean) =>
  hasComparison ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200">
      <GitCompare size={11} />
      Ada Pembanding
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-secondary-50 text-secondary-400 border border-secondary-200">
      Tidak Ada
    </span>
  )

// Wide side-by-side detail modal: left column = audit report, right column = the
// snapshotted SPV report it's compared against (or an empty state when none).
interface AuditDetailModalProps {
  isOpen: boolean
  onClose: () => void
  auditId: string | null
}

const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ isOpen, onClose, auditId }) => {
  const [detail, setDetail] = useState<AuditReportDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !auditId) return
    setDetail(null)
    setError(null)
    setLoading(true)
    getAuditReport(auditId)
      .then((d) => setDetail(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat detail audit'))
      .finally(() => setLoading(false))
  }, [isOpen, auditId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="relative z-50 bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] w-full max-w-7xl overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-500 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-6 sm:py-8 border-b border-secondary-50 bg-gradient-to-r from-white to-secondary-50/30">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-secondary-900 tracking-tight">Detail Audit</h2>
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
        <div className="px-6 sm:px-10 py-6 sm:py-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
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

          {detail && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Audit */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-primary-600 mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} /> Audit
                </h3>
                <ReportDetailView detail={detail.audit} hideChecklist />
              </div>

              {/* Right: SPV snapshot (comparison) */}
              <div className="lg:border-l lg:border-secondary-100 lg:pl-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-secondary-500 mb-4 flex items-center gap-2">
                  <GitCompare size={16} /> Laporan SPV (Pembanding)
                </h3>
                {detail.spvSnapshot ? (
                  <ReportDetailView detail={detail.spvSnapshot} hideChecklist />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-secondary-50/50 rounded-2xl border border-dashed border-secondary-200 text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 text-secondary-300 border border-secondary-100">
                      <GitCompare size={28} strokeWidth={1.5} />
                    </div>
                    <p className="text-secondary-900 font-black uppercase tracking-widest text-xs">
                      Belum ada laporan SPV pembanding
                    </p>
                    <p className="text-secondary-400 text-[11px] font-medium mt-2">
                      Outlet ini belum memiliki laporan SPV pada saat audit disubmit.
                    </p>
                  </div>
                )}
              </div>

              {/* Baris checklist terpisah — kedua kolom mulai di garis grid yang
                  sama sehingga section checklist audit & SPV selalu sejajar,
                  berapapun tinggi laporan di atasnya. */}
              <ReportChecklist detail={detail.audit} />
              {detail.spvSnapshot && (
                <div className="lg:border-l lg:border-secondary-100 lg:pl-8">
                  <ReportChecklist detail={detail.spvSnapshot} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Audit: React.FC = () => {
  const [reports, setReports] = useState<AuditReportListItem[]>([])
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

  // Detail modal state
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const query: AuditReportsQuery = { sort_by: sortBy, page: currentPage, page_size: pageSize }
      if (keyword) query.keyword = keyword
      if (startDate) query.start_date = startDate
      if (endDate) query.end_date = endDate
      const data = await getAuditReports(query)
      setReports(data.reports || [])
      setTotalReports(data.pagination?.total ?? data.summary?.total_reports ?? (data.reports?.length ?? 0))
      setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit reports')
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
    setSelectedAuditId(id)
    setIsDetailOpen(true)
  }

  const columns: Column<AuditReportListItem>[] = [
    {
      key: 'outletName',
      header: 'Outlet',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={13} className="text-secondary-400 shrink-0" />
          <span className="font-bold text-secondary-900">{row.outletName}</span>
        </div>
      ),
    },
    {
      key: 'auditorName',
      header: 'Auditor',
      render: (row) => (
        <div className="flex items-center gap-1 text-sm text-secondary-700">
          <User size={13} className="text-secondary-400" />
          {row.auditorName}
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Tanggal Submit',
      render: (row) => (
        <p className="text-sm font-bold text-secondary-900 flex items-center gap-1">
          <Calendar size={12} className="text-secondary-400" />
          {new Date(row.submittedAt).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      ),
    },
    {
      key: 'checklistScore',
      header: 'Skor Checklist',
      render: (row) => (
        <span className="text-sm font-black text-secondary-700">{row.checklistScore}%</span>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Status',
      render: (row) => statusBadge(row.approvalStatus),
    },
    {
      key: 'hasComparison',
      header: 'Pembanding',
      render: (row) => comparisonBadge(row.hasComparison),
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Audit</h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Daftar laporan audit kunjungan outlet
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
              {totalReports} total
            </span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Keyword */}
        <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-secondary-400 ml-1">Cari</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari outlet atau auditor..."
            className="px-4 py-3 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700 placeholder:text-secondary-400 placeholder:font-medium"
          />
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
            <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2">Audit Error</h4>
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
            <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Memuat laporan audit...</p>
            <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">Please wait a moment</p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-secondary-200">
          <div className="w-24 h-24 bg-secondary-50 rounded-2xl flex items-center justify-center mb-6 text-secondary-200 border border-secondary-100">
            <ShieldCheck size={40} strokeWidth={1} />
          </div>
          <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Tidak Ada Laporan Audit</p>
          <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">
            {keyword || startDate || endDate ? 'Coba sesuaikan filter pencarian' : 'Belum ada laporan audit'}
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
      <AuditDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        auditId={selectedAuditId}
      />
    </div>
  )
}
