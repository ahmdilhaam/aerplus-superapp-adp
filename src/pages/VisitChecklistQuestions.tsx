import { useState, useEffect, useMemo } from 'react'
import { Search, ListChecks, AlertCircle, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react'
import type { AdminChecklistQuestion, Column } from '../types'
import {
  getAdminChecklistQuestions,
  createAdminChecklistQuestion,
  updateAdminChecklistQuestion,
  deleteAdminChecklistQuestion,
  getChecklistCategories,
  getChecklistSections,
} from '../services/api'
import { DataTable } from '../components/DataTable'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { useAuth } from '../contexts/AuthContext'
import { canCreate, canUpdate, canDelete, getPermissionDeniedMessage } from '../utils/permissions'

const PAGE_SIZE_OPTIONS = [10, 50, 100]

type FormState = {
  category: string
  section: string
  question: string
  weight: number
  isActive: boolean
  sortOrder?: number
}

const emptyForm: FormState = { category: '', section: '', question: '', weight: 1, isActive: true }

export const VisitChecklistQuestions: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [questions, setQuestions] = useState<AdminChecklistQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Suggestions untuk combobox (datalist)
  const [categories, setCategories] = useState<string[]>([])
  const [sections, setSections] = useState<string[]>([])

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<FormState>(emptyForm)
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  // Delete modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        const data = await getAdminChecklistQuestions()
        setQuestions(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat pertanyaan checklist')
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  // Muat suggestion category & section saat modal dibuka
  useEffect(() => {
    if (!isModalOpen && !isEditModalOpen) return
    let cancelled = false
    const loadMeta = async () => {
      try {
        const [cats, secs] = await Promise.all([
          getChecklistCategories(),
          getChecklistSections(),
        ])
        if (cancelled) return
        setCategories(cats)
        setSections(secs)
      } catch (err) {
        console.error('Gagal memuat kategori/section:', err)
      }
    }
    loadMeta()
    return () => {
      cancelled = true
    }
  }, [isModalOpen, isEditModalOpen])

  // Opsi filter diturunkan dari data yang sudah dimuat (selalu sinkron).
  const categoryOptions = useMemo(
    () => Array.from(new Set(questions.map((q) => q.category))).sort((a, b) => a.localeCompare(b)),
    [questions]
  )
  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          questions
            .filter((q) => !filterCategory || q.category === filterCategory)
            .map((q) => q.section)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [questions, filterCategory]
  )

  const filteredQuestions = useMemo(() => {
    const q = search.toLowerCase()
    return questions.filter(
      (row) =>
        (!filterCategory || row.category === filterCategory) &&
        (!filterSection || row.section === filterSection) &&
        (row.question.toLowerCase().includes(q) ||
          row.category.toLowerCase().includes(q) ||
          row.section.toLowerCase().includes(q))
    )
  }, [questions, search, filterCategory, filterSection])

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage)
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleCreate = async () => {
    if (!canCreate(currentUser)) {
      setSubmitError(getPermissionDeniedMessage('create checklist questions'))
      return
    }
    if (!formData.category.trim() || !formData.section.trim() || !formData.question.trim()) {
      setSubmitError('Kategori, section, dan pertanyaan harus diisi')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const created = await createAdminChecklistQuestion({
        category: formData.category.trim(),
        section: formData.section.trim(),
        question: formData.question.trim(),
        weight: formData.weight,
        isActive: formData.isActive,
      })
      setQuestions([...questions, created])
      setIsModalOpen(false)
      setFormData(emptyForm)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal membuat pertanyaan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (row: AdminChecklistQuestion) => {
    setEditingId(row.id)
    setEditFormData({
      category: row.category,
      section: row.section,
      question: row.question,
      weight: row.weight,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    })
    setIsEditModalOpen(true)
    setEditError(null)
  }

  const handleUpdate = async () => {
    if (!canUpdate(currentUser)) {
      setEditError(getPermissionDeniedMessage('update checklist questions'))
      return
    }
    if (!editingId) return
    if (
      !editFormData.category.trim() ||
      !editFormData.section.trim() ||
      !editFormData.question.trim()
    ) {
      setEditError('Kategori, section, dan pertanyaan harus diisi')
      return
    }

    try {
      setIsEditSubmitting(true)
      setEditError(null)
      const updated = await updateAdminChecklistQuestion(editingId, {
        category: editFormData.category.trim(),
        section: editFormData.section.trim(),
        question: editFormData.question.trim(),
        weight: editFormData.weight,
        sortOrder: editFormData.sortOrder,
        isActive: editFormData.isActive,
      })
      setQuestions(questions.map((row) => (row.id === editingId ? updated : row)))
      setIsEditModalOpen(false)
      setEditingId(null)
      setEditFormData(emptyForm)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Gagal mengubah pertanyaan')
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleDelete = (row: AdminChecklistQuestion) => {
    setDeletingId(row.id)
    setDeletingName(row.question)
    setIsDeleteConfirmOpen(true)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return
    if (!canDelete(currentUser)) {
      setDeleteError(getPermissionDeniedMessage('delete checklist questions'))
      return
    }

    try {
      setIsDeleting(true)
      setDeleteError(null)
      await deleteAdminChecklistQuestion(deletingId)
      setQuestions(questions.filter((row) => row.id !== deletingId))
      setIsDeleteConfirmOpen(false)
      setDeletingId(null)
      setDeletingName('')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus pertanyaan')
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: Column<AdminChecklistQuestion>[] = [
    {
      key: 'category',
      header: 'Kategori',
      render: (row) => <span className="font-semibold text-gray-900">{row.category}</span>,
    },
    {
      key: 'section',
      header: 'Section',
      className: 'hidden md:table-cell',
      render: (row) => <span className="text-sm text-gray-600">{row.section}</span>,
    },
    {
      key: 'question',
      header: 'Pertanyaan',
      render: (row) => (
        <span className="text-sm text-gray-800 line-clamp-2 max-w-md">{row.question}</span>
      ),
    },
    {
      key: 'weight',
      header: 'Bobot',
      className: 'hidden sm:table-cell',
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-xs font-bold">
          {row.weight}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      className: 'hidden sm:table-cell',
      render: (row) =>
        row.isActive ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
            Nonaktif
          </span>
        ),
    },
    {
      key: 'id',
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            disabled={!canUpdate(currentUser)}
            onClick={() => handleEdit(row)}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={canUpdate(currentUser) ? 'Edit pertanyaan' : 'Only SUPER_ADMIN and COMPANY_ADMIN can edit'}
          >
            <Edit2 size={16} />
          </button>
          <button
            disabled={!canDelete(currentUser)}
            onClick={() => handleDelete(row)}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={canDelete(currentUser) ? 'Hapus pertanyaan' : 'Only SUPER_ADMIN and COMPANY_ADMIN can delete'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">
            Checklist Visit
          </h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Kelola pertanyaan checklist penilaian visit
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
              {filteredQuestions.length} total
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={!canCreate(currentUser)}
            onClick={() => setIsModalOpen(true)}
            title={canCreate(currentUser) ? '' : 'Only SUPER_ADMIN and COMPANY_ADMIN can add questions'}
            variant="primary"
            className="gap-2"
          >
            <Plus size={20} />
            Tambah Pertanyaan
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative group w-full lg:max-w-sm">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari pertanyaan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-14 pr-6 py-4.5 bg-white border border-secondary-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold placeholder:text-secondary-400 placeholder:font-medium"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setFilterSection('')
                setCurrentPage(1)
              }}
              className="w-full appearance-none pl-5 pr-12 py-4.5 bg-white border border-secondary-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700"
            >
              <option value="">Semua Kategori</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
              size={18}
            />
          </div>

          <div className="relative">
            <select
              value={filterSection}
              onChange={(e) => {
                setFilterSection(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full appearance-none pl-5 pr-12 py-4.5 bg-white border border-secondary-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700"
            >
              <option value="">Semua Section</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
              size={18}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-center py-24 bg-white rounded-2xl border border-primary-100 shadow-sm">
          <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-lg shadow-rose-200">
            <AlertCircle size={32} strokeWidth={2.5} />
          </div>
          <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2">Gagal Memuat</h4>
          <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px] bg-rose-50 px-4 py-1.5 rounded-full inline-block">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32 bg-white rounded-2xl border border-secondary-100 shadow-sm">
          <div className="text-center">
            <div className="relative mb-6 mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">
              Memuat pertanyaan...
            </p>
          </div>
        </div>
      ) : paginatedQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-secondary-200">
          <div className="w-24 h-24 bg-secondary-50 rounded-2xl flex items-center justify-center mb-6 text-secondary-200 border border-secondary-100">
            <ListChecks size={40} strokeWidth={1} />
          </div>
          <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">
            Belum Ada Pertanyaan
          </p>
          <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">
            {search ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan menambah pertanyaan checklist'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50 overflow-hidden">
            <DataTable columns={columns} data={paginatedQuestions} />
          </div>

          <div className="bg-white px-8 py-6 rounded-2xl border border-secondary-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-gray-50 border border-secondary-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all text-xs font-bold text-secondary-700"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} / halaman
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
                  size={16}
                />
              </div>
              <p className="hidden md:block text-[11px] font-bold text-secondary-500 uppercase tracking-widest">
                <span className="text-primary-600 font-black">{filteredQuestions.length}</span> Results
              </p>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-4">
                <p className="hidden md:block text-[11px] font-bold text-secondary-500 uppercase tracking-widest">
                  Page <span className="text-primary-600 font-black">{currentPage}</span> of{' '}
                  <span className="text-secondary-900 font-black">{totalPages}</span>
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Pertanyaan Checklist">
        <QuestionForm
          value={formData}
          onChange={setFormData}
          categories={categories}
          sections={sections}
          error={submitError}
          mode="create"
          isSubmitting={isSubmitting}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Pertanyaan Checklist">
        <QuestionForm
          value={editFormData}
          onChange={setEditFormData}
          categories={categories}
          sections={sections}
          error={editError}
          mode="edit"
          isSubmitting={isEditSubmitting}
          onCancel={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdate}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Hapus Pertanyaan">
        <div className="space-y-6">
          {deleteError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="text-red-800 font-bold text-sm">Error</p>
                <p className="text-red-600 text-xs mt-1">{deleteError}</p>
              </div>
            </div>
          )}

          <div className="p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-4">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 size={20} strokeWidth={2.5} />
            </div>
            <p className="text-sm text-secondary-900 font-medium leading-relaxed pt-1">
              Yakin ingin menghapus pertanyaan{' '}
              <span className="font-black text-rose-600 italic">"{deletingName}"</span>? Tindakan ini
              permanen dan tidak bisa dibatalkan.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting} className="w-full">
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting} className="w-full">
              {isDeleting ? 'Menghapus...' : 'Konfirmasi Hapus'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

type QuestionFormProps = {
  value: FormState
  onChange: (next: FormState) => void
  categories: string[]
  sections: string[]
  error: string | null
  mode: 'create' | 'edit'
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: () => void
}

const inputClass =
  'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium'
const labelClass = 'text-xs font-bold text-gray-700 uppercase tracking-wider ml-1'

const QuestionForm: React.FC<QuestionFormProps> = ({
  value,
  onChange,
  categories,
  sections,
  error,
  mode,
  isSubmitting,
  onCancel,
  onSubmit,
}) => {
  const disabled =
    isSubmitting || !value.category.trim() || !value.section.trim() || !value.question.trim()

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
          <div>
            <p className="text-red-800 font-bold text-sm">Error</p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Kategori</label>
          <input
            type="text"
            list="checklist-categories"
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
            placeholder="mis. Kebersihan"
            className={inputClass}
          />
          <datalist id="checklist-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Section</label>
          <input
            type="text"
            list="checklist-sections"
            value={value.section}
            onChange={(e) => onChange({ ...value, section: e.target.value })}
            placeholder="mis. Area Parkir"
            className={inputClass}
          />
          <datalist id="checklist-sections">
            {sections.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Pertanyaan</label>
        <textarea
          value={value.question}
          onChange={(e) => onChange({ ...value, question: e.target.value })}
          placeholder="Tulis pertanyaan checklist..."
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={labelClass}>Bobot</label>
          <input
            type="number"
            min={1}
            value={value.weight}
            onChange={(e) => onChange({ ...value, weight: Number(e.target.value) || 1 })}
            className={inputClass}
          />
        </div>

        {mode === 'edit' && (
          <div className="space-y-2">
            <label className={labelClass}>Urutan (sortOrder)</label>
            <input
              type="number"
              min={0}
              value={value.sortOrder ?? 0}
              onChange={(e) => onChange({ ...value, sortOrder: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={value.isActive}
          onChange={(e) => onChange({ ...value, isActive: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm font-medium text-gray-700">Pertanyaan aktif</span>
      </label>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting} className="w-full">
          Batal
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={disabled} className="w-full">
          {isSubmitting
            ? mode === 'create'
              ? 'Menyimpan...'
              : 'Menyimpan...'
            : mode === 'create'
              ? 'Tambah Pertanyaan'
              : 'Simpan Perubahan'}
        </Button>
      </div>
    </div>
  )
}
