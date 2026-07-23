import { useState, useEffect, useMemo } from 'react'
import { Search, AlertCircle, Plus, Edit2, Trash2, Lightbulb } from 'lucide-react'
import type {
  Column,
  InsightRule,
  InsightRuleConfig,
  InsightRuleType,
  InsightSeverity,
} from '../types'
import {
  getInsightRules,
  createInsightRule,
  updateInsightRule,
  deleteInsightRule,
} from '../services/api'
import { DataTable } from '../components/DataTable'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { useAuth } from '../contexts/AuthContext'
import { canCreate, canUpdate, canDelete, getPermissionDeniedMessage } from '../utils/permissions'

const ITEMS_PER_PAGE = 10

const RULE_TYPE_LABEL: Record<InsightRuleType, string> = {
  delivery_cost_over_budget: 'Biaya Pengantaran Melebihi Budget',
  stock_low_below_threshold: 'Stok Rendah',
  expense_over_budget: 'Pengeluaran Melebihi Budget',
  sales_below_target: 'Penjualan di Bawah Target',
}

const SEVERITY_BADGE: Record<InsightSeverity, 'info' | 'warning' | 'error'> = {
  info: 'info',
  warning: 'warning',
  critical: 'error',
}

type FormState = {
  ruleType: InsightRuleType
  severity: InsightSeverity
  enabled: boolean
  titleTemplate: string
  descriptionTemplate: string
  sortOrder: number
  // Flat config fields — interpreted per ruleType
  defaultBudgetMonthly: string
  defaultTargetMonthly: string
  thresholdPercent: string
  category: string
  itemName: string
  minQuantity: string
}

const emptyForm = (): FormState => ({
  ruleType: 'delivery_cost_over_budget',
  severity: 'info',
  enabled: true,
  titleTemplate: '',
  descriptionTemplate: '',
  sortOrder: 0,
  defaultBudgetMonthly: '',
  defaultTargetMonthly: '',
  thresholdPercent: '100',
  category: '',
  itemName: '',
  minQuantity: '',
})

function configToForm(rule: InsightRule): FormState {
  const c = rule.config as unknown as Record<string, unknown>
  return {
    ruleType: rule.ruleType,
    severity: rule.severity,
    enabled: rule.enabled,
    titleTemplate: rule.titleTemplate,
    descriptionTemplate: rule.descriptionTemplate,
    sortOrder: rule.sortOrder,
    defaultBudgetMonthly: typeof c.defaultBudgetMonthly === 'number' ? String(c.defaultBudgetMonthly) : '',
    defaultTargetMonthly: typeof c.defaultTargetMonthly === 'number' ? String(c.defaultTargetMonthly) : '',
    thresholdPercent: typeof c.thresholdPercent === 'number' ? String(c.thresholdPercent) : '100',
    category: typeof c.category === 'string' ? c.category : '',
    itemName: typeof c.itemName === 'string' ? c.itemName : '',
    minQuantity: typeof c.minQuantity === 'number' ? String(c.minQuantity) : '',
  }
}

function formToConfig(form: FormState): { config: InsightRuleConfig; error: string | null } {
  const n = (s: string) => Number.parseInt(s, 10)
  switch (form.ruleType) {
    case 'delivery_cost_over_budget':
    case 'expense_over_budget': {
      const budget = n(form.defaultBudgetMonthly)
      const threshold = n(form.thresholdPercent)
      if (!Number.isFinite(budget) || budget < 0) return { config: {} as InsightRuleConfig, error: 'Budget bulanan harus angka non-negatif' }
      if (!Number.isFinite(threshold) || threshold < 0) return { config: {} as InsightRuleConfig, error: 'Threshold % harus angka non-negatif' }
      const base = { defaultBudgetMonthly: budget, thresholdPercent: threshold }
      const config = form.ruleType === 'expense_over_budget' && form.category.trim()
        ? { ...base, category: form.category.trim() }
        : base
      return { config: config as InsightRuleConfig, error: null }
    }
    case 'stock_low_below_threshold': {
      const min = n(form.minQuantity)
      if (!form.itemName.trim()) return { config: {} as InsightRuleConfig, error: 'Nama item harus diisi' }
      if (!Number.isFinite(min) || min < 0) return { config: {} as InsightRuleConfig, error: 'Min quantity harus angka non-negatif' }
      return { config: { itemName: form.itemName.trim(), minQuantity: min }, error: null }
    }
    case 'sales_below_target': {
      const target = n(form.defaultTargetMonthly)
      if (!Number.isFinite(target) || target < 0) return { config: {} as InsightRuleConfig, error: 'Target bulanan harus angka non-negatif' }
      return { config: { defaultTargetMonthly: target }, error: null }
    }
  }
}

export const InsightRules: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [rules, setRules] = useState<InsightRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<FormState>(emptyForm())
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm())
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingLabel, setDeletingLabel] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getInsightRules()
        setRules(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch insight rules')
        setRules([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return rules.filter((r) =>
      r.titleTemplate.toLowerCase().includes(s) ||
      r.descriptionTemplate.toLowerCase().includes(s) ||
      r.ruleType.toLowerCase().includes(s)
    )
  }, [rules, search])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const submitCreate = async () => {
    if (!canCreate(currentUser)) {
      setCreateError(getPermissionDeniedMessage('create insight rules'))
      return
    }
    if (!createForm.titleTemplate.trim() || !createForm.descriptionTemplate.trim()) {
      setCreateError('Title dan description template wajib diisi')
      return
    }
    const { config, error: configError } = formToConfig(createForm)
    if (configError) {
      setCreateError(configError)
      return
    }
    try {
      setIsCreating(true)
      setCreateError(null)
      const newRule = await createInsightRule({
        ruleType: createForm.ruleType,
        severity: createForm.severity,
        enabled: createForm.enabled,
        titleTemplate: createForm.titleTemplate.trim(),
        descriptionTemplate: createForm.descriptionTemplate.trim(),
        sortOrder: createForm.sortOrder,
        config,
      })
      setRules([newRule, ...rules])
      setIsCreateOpen(false)
      setCreateForm(emptyForm())
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Gagal membuat insight rule')
    } finally {
      setIsCreating(false)
    }
  }

  const startEdit = (rule: InsightRule) => {
    setEditingId(rule.id)
    setEditForm(configToForm(rule))
    setEditError(null)
    setIsEditOpen(true)
  }

  const submitEdit = async () => {
    if (!editingId) return
    if (!canUpdate(currentUser)) {
      setEditError(getPermissionDeniedMessage('update insight rules'))
      return
    }
    if (!editForm.titleTemplate.trim() || !editForm.descriptionTemplate.trim()) {
      setEditError('Title dan description template wajib diisi')
      return
    }
    const { config, error: configError } = formToConfig(editForm)
    if (configError) {
      setEditError(configError)
      return
    }
    try {
      setIsEditing(true)
      setEditError(null)
      const updated = await updateInsightRule(editingId, {
        ruleType: editForm.ruleType,
        severity: editForm.severity,
        enabled: editForm.enabled,
        titleTemplate: editForm.titleTemplate.trim(),
        descriptionTemplate: editForm.descriptionTemplate.trim(),
        sortOrder: editForm.sortOrder,
        config,
      })
      setRules(rules.map((r) => (r.id === editingId ? updated : r)))
      setIsEditOpen(false)
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Gagal mengubah insight rule')
    } finally {
      setIsEditing(false)
    }
  }

  const startDelete = (rule: InsightRule) => {
    setDeletingId(rule.id)
    setDeletingLabel(rule.titleTemplate)
    setDeleteError(null)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    if (!canDelete(currentUser)) {
      setDeleteError(getPermissionDeniedMessage('delete insight rules'))
      return
    }
    try {
      setIsDeleting(true)
      setDeleteError(null)
      await deleteInsightRule(deletingId)
      setRules(rules.filter((r) => r.id !== deletingId))
      setIsDeleteOpen(false)
      setDeletingId(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus insight rule')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<InsightRule>[] = [
    {
      key: 'ruleType',
      header: 'Tipe',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          <span className="font-medium text-gray-900 text-sm">{RULE_TYPE_LABEL[row.ruleType]}</span>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => <Badge variant={SEVERITY_BADGE[row.severity]} label={row.severity} />,
    },
    {
      key: 'enabled',
      header: 'Aktif',
      render: (row) => (
        <Badge variant={row.enabled ? 'success' : 'default'} label={row.enabled ? 'enabled' : 'disabled'} />
      ),
    },
    {
      key: 'titleTemplate',
      header: 'Title Template',
      className: 'hidden md:table-cell',
      render: (row) => <span className="text-sm text-gray-700">{row.titleTemplate}</span>,
    },
    {
      key: 'sortOrder',
      header: 'Sort',
      className: 'hidden sm:table-cell',
      render: (row) => <span className="text-xs text-gray-500">{row.sortOrder}</span>,
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            disabled={!canUpdate(currentUser)}
            onClick={() => startEdit(row)}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={canUpdate(currentUser) ? 'Edit rule' : 'Only SUPER_ADMIN and COMPANY_ADMIN can edit'}
          >
            <Edit2 size={16} />
          </button>
          <button
            disabled={!canDelete(currentUser)}
            onClick={() => startDelete(row)}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={canDelete(currentUser) ? 'Delete rule' : 'Only SUPER_ADMIN and COMPANY_ADMIN can delete'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  const renderConfigFields = (form: FormState, set: (f: FormState) => void) => {
    switch (form.ruleType) {
      case 'delivery_cost_over_budget':
      case 'expense_over_budget':
        return (
          <>
            <FormInput label="Budget Bulanan Default (Rp)" type="number" value={form.defaultBudgetMonthly}
              onChange={(v) => set({ ...form, defaultBudgetMonthly: v })} />
            <FormInput label="Threshold (%)" type="number" value={form.thresholdPercent}
              onChange={(v) => set({ ...form, thresholdPercent: v })} />
            {form.ruleType === 'expense_over_budget' && (
              <FormInput label="Kategori (opsional)" type="text" value={form.category}
                onChange={(v) => set({ ...form, category: v })} />
            )}
          </>
        )
      case 'stock_low_below_threshold':
        return (
          <>
            <FormInput label="Nama Item" type="text" value={form.itemName}
              onChange={(v) => set({ ...form, itemName: v })} />
            <FormInput label="Min Quantity" type="number" value={form.minQuantity}
              onChange={(v) => set({ ...form, minQuantity: v })} />
          </>
        )
      case 'sales_below_target':
        return (
          <FormInput label="Target Bulanan Default (Rp)" type="number" value={form.defaultTargetMonthly}
            onChange={(v) => set({ ...form, defaultTargetMonthly: v })} />
        )
    }
  }

  const renderForm = (form: FormState, set: (f: FormState) => void, error: string | null, isEdit: boolean) => (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-bold text-sm">Error</p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Rule Type</label>
        <select
          value={form.ruleType}
          disabled={isEdit}
          onChange={(e) => set({ ...form, ruleType: e.target.value as InsightRuleType })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium disabled:opacity-60"
        >
          {(Object.keys(RULE_TYPE_LABEL) as InsightRuleType[]).map((k) => (
            <option key={k} value={k}>{RULE_TYPE_LABEL[k]}</option>
          ))}
        </select>
        {isEdit && <p className="text-[10px] text-gray-500 ml-1">Tipe tidak bisa diubah saat edit.</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Severity</label>
          <select
            value={form.severity}
            onChange={(e) => set({ ...form, severity: e.target.value as InsightSeverity })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          >
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="critical">critical</option>
          </select>
        </div>
        <FormInput label="Sort Order" type="number" value={String(form.sortOrder)}
          onChange={(v) => set({ ...form, sortOrder: Number.parseInt(v, 10) || 0 })} />
      </div>

      <FormInput label="Title Template" type="text" value={form.titleTemplate}
        onChange={(v) => set({ ...form, titleTemplate: v })}
        placeholder="e.g. Biaya pengantaran {outletName} melebihi budget" />
      <FormInput label="Description Template" type="text" value={form.descriptionTemplate}
        onChange={(v) => set({ ...form, descriptionTemplate: v })}
        placeholder="e.g. Realisasi: {percent}% dari budget" />

      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-4">
        <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest">Config</p>
        {renderConfigFields(form, set)}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => set({ ...form, enabled: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Enabled
      </label>
    </div>
  )

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Insight Rules</h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Configure dashboard insight thresholds
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
              {filtered.length} total
            </span>
          </p>
        </div>
        <Button
          disabled={!canCreate(currentUser)}
          onClick={() => { setCreateForm(emptyForm()); setCreateError(null); setIsCreateOpen(true) }}
          variant="primary"
          className="gap-2"
        >
          <Plus size={20} />
          Add Rule
        </Button>
      </div>

      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search rules by type or template..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
          className="w-full pl-14 pr-6 py-4.5 bg-white border border-secondary-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold placeholder:text-secondary-400"
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
          <AlertCircle className="text-rose-600" size={20} />
          <p className="text-rose-700 text-sm font-semibold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-secondary-400 text-sm font-semibold">Loading...</div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-secondary-200">
          <div className="w-24 h-24 bg-secondary-50 rounded-2xl flex items-center justify-center mb-6 text-secondary-200 border border-secondary-100">
            <Lightbulb size={40} strokeWidth={1} />
          </div>
          <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">No Insight Rules</p>
          <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">
            {search ? 'Try a different search' : 'Start by adding a new rule'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm overflow-hidden">
            <DataTable columns={columns} data={paginated} />
          </div>
          {totalPages > 1 && (
            <div className="bg-white px-8 py-6 rounded-2xl border border-secondary-100 shadow-sm flex items-center justify-between">
              <p className="hidden md:block text-[11px] font-bold text-secondary-500 uppercase tracking-widest">
                Page <span className="text-primary-600 font-black">{currentPage}</span> of <span className="text-secondary-900 font-black">{totalPages}</span>
              </p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Insight Rule">
        {renderForm(createForm, setCreateForm, createError, false)}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-6 border-t border-gray-100">
          <Button variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="w-full">Cancel</Button>
          <Button variant="primary" onClick={submitCreate} disabled={isCreating} className="w-full">
            {isCreating ? 'Creating...' : 'Create Rule'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Insight Rule">
        {renderForm(editForm, setEditForm, editError, true)}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-6 border-t border-gray-100">
          <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isEditing} className="w-full">Cancel</Button>
          <Button variant="primary" onClick={submitEdit} disabled={isEditing} className="w-full">
            {isEditing ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Insight Rule">
        <div className="space-y-6">
          {deleteError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
              <p className="text-red-700 text-sm">{deleteError}</p>
            </div>
          )}
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 size={20} strokeWidth={2.5} />
            </div>
            <p className="text-sm text-secondary-900 font-medium leading-relaxed pt-1">
              Hapus rule <span className="font-black text-rose-600 italic">"{deletingLabel}"</span>? Tindakan ini permanen.
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting} className="w-full">Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isDeleting} className="w-full">
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

type FormInputProps = { label: string; type: 'text' | 'number'; value: string; onChange: (v: string) => void; placeholder?: string }
const FormInput: React.FC<FormInputProps> = ({ label, type, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
    />
  </div>
)
