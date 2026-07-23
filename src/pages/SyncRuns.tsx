import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle, CheckCircle, Loader, XCircle, Activity } from 'lucide-react'
import type { Column, SyncRun, SyncSource, SyncState, SyncStatus } from '../types'
import { getSyncRuns, getSyncState } from '../services/api'
import { DataTable } from '../components/DataTable'
import { Badge } from '../components/Badge'

const SOURCE_LABEL: Record<SyncSource, string> = {
  sale: 'Sale',
  delivery_cost: 'Delivery Cost',
  expense: 'Expense',
  stock: 'Stock',
}

const STATUS_BADGE: Record<SyncStatus, 'success' | 'error' | 'info'> = {
  success: 'success',
  failed: 'error',
  running: 'info',
}

function fmtDate(s: string | null): string {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('id-ID', { hour12: false })
}

export const SyncRuns: React.FC = () => {
  const [runs, setRuns] = useState<SyncRun[]>([])
  const [state, setState] = useState<SyncState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [source, setSource] = useState<SyncSource | ''>('')
  const [status, setStatus] = useState<SyncStatus | ''>('')
  const [limit, setLimit] = useState<number>(50)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [runsData, stateData] = await Promise.all([
        getSyncRuns({
          source: source || undefined,
          status: status || undefined,
          limit,
        }),
        getSyncState(),
      ])
      setRuns(runsData)
      setState(stateData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sync data')
      setRuns([])
      setState([])
    } finally {
      setLoading(false)
    }
  }, [source, status, limit])

  useEffect(() => {
    load()
  }, [load])

  const columns: Column<SyncRun>[] = [
    {
      key: 'source',
      header: 'Source',
      render: (r) => <span className="font-medium text-gray-900 text-sm">{SOURCE_LABEL[r.source]}</span>,
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (r) => <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">{r.mode}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge variant={STATUS_BADGE[r.status]} label={r.status} />,
    },
    {
      key: 'recordsFetched',
      header: 'Fetched',
      className: 'hidden sm:table-cell',
      render: (r) => <span className="text-sm text-gray-700">{r.recordsFetched}</span>,
    },
    {
      key: 'recordsUpserted',
      header: 'Upserted',
      className: 'hidden sm:table-cell',
      render: (r) => <span className="text-sm text-gray-700">{r.recordsUpserted}</span>,
    },
    {
      key: 'startedAt',
      header: 'Started',
      className: 'hidden md:table-cell',
      render: (r) => <span className="text-xs text-gray-500">{fmtDate(r.startedAt)}</span>,
    },
    {
      key: 'finishedAt',
      header: 'Finished',
      className: 'hidden md:table-cell',
      render: (r) => <span className="text-xs text-gray-500">{fmtDate(r.finishedAt)}</span>,
    },
    {
      key: 'errorMessage',
      header: 'Error',
      render: (r) => r.errorMessage
        ? <span className="text-xs text-rose-600 font-medium" title={r.errorMessage}>{r.errorMessage.slice(0, 80)}{r.errorMessage.length > 80 ? '…' : ''}</span>
        : <span className="text-xs text-gray-400">-</span>,
    },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Sync Runs</h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            POS sync job audit log
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
              {runs.length} shown
            </span>
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Sync State per source */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-secondary-500 mb-4 flex items-center gap-2">
          <Activity size={14} /> Current State per Source
        </h2>
        {state.length === 0 ? (
          <div className="text-secondary-400 text-xs italic">Belum ada cursor tersimpan</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {state.map((s) => (
              <div key={s.source} className="bg-white border border-secondary-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-secondary-900">{SOURCE_LABEL[s.source]}</span>
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>
                <p className="text-[10px] text-secondary-400 uppercase tracking-wider mb-1">Last Synced</p>
                <p className="text-sm font-semibold text-secondary-700">{fmtDate(s.lastSyncedAt)}</p>
                <p className="text-[10px] text-secondary-400 uppercase tracking-wider mt-3 mb-1">Cursor</p>
                <p className="text-xs font-mono text-secondary-600 break-all">{s.lastCursor || '-'}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as SyncSource | '')}
          className="px-4 py-3 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
        >
          <option value="">All sources</option>
          {(Object.keys(SOURCE_LABEL) as SyncSource[]).map((s) => (
            <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SyncStatus | '')}
          className="px-4 py-3 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
        >
          <option value="">All statuses</option>
          <option value="running">running</option>
          <option value="success">success</option>
          <option value="failed">failed</option>
        </select>
        <select
          value={limit}
          onChange={(e) => setLimit(Number.parseInt(e.target.value, 10))}
          className="px-4 py-3 bg-white border border-secondary-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold"
        >
          <option value={25}>Limit 25</option>
          <option value={50}>Limit 50</option>
          <option value={100}>Limit 100</option>
          <option value={200}>Limit 200</option>
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
          <XCircle className="text-rose-600" size={20} />
          <p className="text-rose-700 text-sm font-semibold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-secondary-400">
          <Loader className="animate-spin mr-2" size={20} /> Loading sync runs...
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-secondary-200">
          <div className="w-24 h-24 bg-secondary-50 rounded-2xl flex items-center justify-center mb-6 text-secondary-200 border border-secondary-100">
            <AlertCircle size={40} strokeWidth={1} />
          </div>
          <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">No Sync Runs</p>
          <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">Try changing the filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm overflow-hidden">
          <DataTable columns={columns} data={runs} />
        </div>
      )}
    </div>
  )
}
