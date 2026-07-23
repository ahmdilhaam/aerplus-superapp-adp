import { useState, useEffect, useMemo } from 'react'
import { Search, MapPin, AlertCircle, Plus, Loader, Edit2, Trash2 } from 'lucide-react'
import type { Area, Column, User } from '../types'
import { getAreas, getUsers, createArea, updateArea, deleteArea } from '../services/api'
import { DataTable } from '../components/DataTable'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { useAuth } from '../contexts/AuthContext'
import { canCreate, canUpdate, canDelete, getPermissionDeniedMessage } from '../utils/permissions'

const ITEMS_PER_PAGE = 10

export const Areas: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', spvAreaUserId: '' })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', spvAreaUserId: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  // Delete modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Users list for select
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setLoading(true)
        const data = await getAreas()
        setAreas(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch areas')
        setAreas([])
      } finally {
        setLoading(false)
      }
    }

    fetchAreas()
  }, [])

  // Fetch users when modal opens
  useEffect(() => {
    if (!isModalOpen && !isEditModalOpen) return

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const areaSupervisors = await getUsers('AREA_SUPERVISOR')
        setUsers(areaSupervisors)
      } catch (err) {
        console.error('Failed to fetch users:', err)
        setUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [isModalOpen, isEditModalOpen])

  // Filter areas based on search
  const filteredAreas = useMemo(() => {
    return areas.filter((area) =>
      area.name.toLowerCase().includes(search.toLowerCase()) ||
      (area.slug && area.slug.toLowerCase().includes(search.toLowerCase())) ||
      (area.description && area.description.toLowerCase().includes(search.toLowerCase()))
    )
  }, [areas, search])

  // Pagination
  const totalPages = Math.ceil(filteredAreas.length / ITEMS_PER_PAGE)
  const paginatedAreas = filteredAreas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Handle create area
  const handleCreateArea = async () => {
    if (!canCreate(currentUser)) {
      setSubmitError(getPermissionDeniedMessage('create areas'))
      return
    }

    if (!formData.name.trim()) {
      setSubmitError('Nama area harus diisi')
      return
    }
    if (!formData.spvAreaUserId) {
      setSubmitError('Supervisor area harus dipilih')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      const newArea = await createArea({
        name: formData.name,
        spvAreaUserId: formData.spvAreaUserId,
      })

      setAreas([newArea, ...areas])
      setIsModalOpen(false)
      setFormData({ name: '', spvAreaUserId: '' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal membuat area')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit area
  const handleEditArea = (area: Area) => {
    setEditingId(area.id)
    setEditFormData({
      name: area.name,
      spvAreaUserId: area.spvAreaUserId || '',
    })
    setIsEditModalOpen(true)
    setEditError(null)
  }

  const handleUpdateArea = async () => {
    if (!canUpdate(currentUser)) {
      setEditError(getPermissionDeniedMessage('update areas'))
      return
    }

    if (!editFormData.name.trim()) {
      setEditError('Nama area harus diisi')
      return
    }

    if (!editingId) return

    try {
      setIsEditSubmitting(true)
      setEditError(null)

      if (!editFormData.spvAreaUserId) {
        setEditError('Supervisor area harus dipilih')
        setIsEditSubmitting(false)
        return
      }

      const updatedArea = await updateArea(editingId, {
        name: editFormData.name,
        spvAreaUserId: editFormData.spvAreaUserId,
      })

      setAreas(areas.map((area) => (area.id === editingId ? updatedArea : area)))
      setIsEditModalOpen(false)
      setEditingId(null)
      setEditFormData({ name: '', spvAreaUserId: '' })
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Gagal mengubah area')
    } finally {
      setIsEditSubmitting(false)
    }
  }

  // Handle delete area
  const handleDeleteArea = (area: Area) => {
    setDeletingId(area.id)
    setDeletingName(area.name)
    setIsDeleteConfirmOpen(true)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingId) return

    if (!canDelete(currentUser)) {
      setDeleteError(getPermissionDeniedMessage('delete areas'))
      return
    }

    try {
      setIsDeleting(true)
      setDeleteError(null)

      await deleteArea(deletingId)

      setAreas(areas.filter((area) => area.id !== deletingId))
      setIsDeleteConfirmOpen(false)
      setDeletingId(null)
      setDeletingName('')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus area')
    } finally {
      setIsDeleting(false)
    }
  }

  // Table columns
  const columns: Column<Area>[] = [
    {
      key: 'name',
      header: 'Nama Area',
      render: (row) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-400" />
          <span className="font-medium text-gray-900">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Dibuat Pada',
      className: 'hidden sm:table-cell',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('id-ID') : '-'}
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
            onClick={() => handleEditArea(row)}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={canUpdate(currentUser) ? "Edit area" : "Only SUPER_ADMIN and COMPANY_ADMIN can edit"}
          >
            <Edit2 size={16} />
          </button>
          <button
            disabled={!canDelete(currentUser)}
            onClick={() => handleDeleteArea(row)}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={canDelete(currentUser) ? "Delete area" : "Only SUPER_ADMIN and COMPANY_ADMIN can delete"}
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Areas</h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Manage all operational areas in the system
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
              {filteredAreas.length} total
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            disabled={!canCreate(currentUser)}
            onClick={() => setIsModalOpen(true)}
            title={canCreate(currentUser) ? "" : "Only SUPER_ADMIN and COMPANY_ADMIN can add areas"}
            variant="primary"
            className="gap-2"
          >
            <Plus size={20} />
            Add Area
          </Button>
        </div>
      </div>

      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search areas by name, slug, or description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full pl-14 pr-6 py-4.5 bg-white border border-secondary-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold placeholder:text-secondary-400 placeholder:font-medium"
        />
      </div>

      {error && (
        <div className="text-center py-24 bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-rose-50/30 opacity-50"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-lg shadow-rose-200">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2">Area Sync Error</h4>
            <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px] bg-rose-50 px-4 py-1.5 rounded-full inline-block mb-4">{error}</p>
            <p className="text-secondary-400 text-[11px] font-semibold italic max-w-xs mx-auto">Our maps are currently offline. Please refresh.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32 bg-white rounded-2xl border border-secondary-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="text-center relative z-10">
            <div className="relative mb-6 mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Locating geographic data...</p>
            <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">Please wait a moment</p>
          </div>
        </div>
      ) : paginatedAreas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-secondary-200">
          <div className="w-24 h-24 bg-secondary-50 rounded-2xl flex items-center justify-center mb-6 text-secondary-200 border border-secondary-100">
            <MapPin size={40} strokeWidth={1} />
          </div>
          <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">No Areas Found</p>
          <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">
            {search ? 'Try adjusting your search criteria' : 'Start by adding a new operational area'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50 overflow-hidden">
            <DataTable columns={columns} data={paginatedAreas} />
          </div>

          {totalPages > 1 && (
            <div className="bg-white px-8 py-6 rounded-2xl border border-secondary-100 shadow-sm flex items-center justify-between">
              <div className="hidden md:block">
                <p className="text-[11px] font-bold text-secondary-500 uppercase tracking-widest flex items-center gap-4">
                  <span>Page <span className="text-primary-600 font-black">{currentPage}</span> of <span className="text-secondary-900 font-black">{totalPages}</span></span>
                  <span className="w-1 h-1 bg-secondary-200 rounded-full"></span>
                  <span><span className="text-primary-600 font-black">{filteredAreas.length}</span> Results</span>
                </p>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Create Area Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Area">
        <div className="space-y-6">
          {submitError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="text-red-800 font-bold text-sm">Error</p>
                <p className="text-red-600 text-xs mt-1">{submitError}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Area Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setSubmitError(null)
              }}
              placeholder="e.g. Jakarta South, West Area"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Area Supervisor</label>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-6">
                <Loader size={20} className="animate-spin text-indigo-600" />
              </div>
            ) : (
              <select
                value={formData.spvAreaUserId}
                onChange={(e) => {
                  setFormData({ ...formData, spvAreaUserId: e.target.value })
                  setSubmitError(null)
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Supervisor --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateArea}
              disabled={isSubmitting || !formData.name || !formData.spvAreaUserId}
              className="w-full"
            >
              {isSubmitting ? 'Creating...' : 'Create Area'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Area Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Area">
        <div className="space-y-6">
          {editError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="text-red-800 font-bold text-sm">Error</p>
                <p className="text-red-600 text-xs mt-1">{editError}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Area Name</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => {
                setEditFormData({ ...editFormData, name: e.target.value })
                setEditError(null)
              }}
              placeholder="e.g. Jakarta South, West Area"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Area Supervisor</label>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-6">
                <Loader size={20} className="animate-spin text-indigo-600" />
              </div>
            ) : (
              <select
                value={editFormData.spvAreaUserId}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, spvAreaUserId: e.target.value })
                  setEditError(null)
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Supervisor --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.username})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateArea}
              disabled={isEditSubmitting || !editFormData.name || !editFormData.spvAreaUserId}
              className="w-full"
            >
              {isEditSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Delete Area">
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
              Are you sure you want to delete <span className="font-black text-rose-600 italic">"{deletingName}"</span>? This action is permanent and cannot be undone.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Destruction'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
