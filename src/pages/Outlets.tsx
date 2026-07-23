import { useState, useEffect, useMemo } from 'react'
import { Search, Building2, CheckCircle2, XCircle, AlertCircle, Edit2, Loader, Plus, Eye } from 'lucide-react'
import type { Outlet, Area, Column } from '../types'
import { getOutlets, getAreas, createOutlet, updateOutlet, activateOutlet, deactivateOutlet } from '../services/api'
import { DataTable } from '../components/DataTable'
import { Pagination } from '../components/Pagination'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { LocationPicker } from '../components/LocationPicker'
import { useAuth } from '../contexts/AuthContext'
import { canCreate, canUpdate, canToggleStatus, getPermissionDeniedMessage } from '../utils/permissions'

const PAGE_SIZE_OPTIONS = [10, 50, 100]

export const Outlets: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ slug: '', name: '', areaId: '', address: '', latitude: null as number | null, longitude: null as number | null })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({ name: '', areaId: '', address: '', latitude: null as number | null, longitude: null as number | null })
  const [editError, setEditError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'activate' | 'deactivate'; outlet: Outlet } | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailOutlet, setDetailOutlet] = useState<Outlet | null>(null)

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        setLoading(true)
        const [outletsData, areasData] = await Promise.all([getOutlets(), getAreas()])
        setOutlets(outletsData)
        setAreas(areasData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch outlets')
        setOutlets([])
      } finally {
        setLoading(false)
      }
    }

    fetchOutlets()
  }, [])

  const handleCreateOutlet = async () => {
    if (!canCreate(currentUser)) {
      setSubmitError(getPermissionDeniedMessage('create outlets'))
      return
    }

    if (!formData.slug || !formData.name) {
      setSubmitError('Please fill in all fields')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)
      const newOutlet = await createOutlet({
        slug: formData.slug,
        name: formData.name,
        areaId: formData.areaId || null,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
      })
      setOutlets([...outlets, newOutlet])
      setFormData({ slug: '', name: '', areaId: '', address: '', latitude: null, longitude: null })
      setIsModalOpen(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create outlet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setFormData({ slug: '', name: '', areaId: '', address: '', latitude: null, longitude: null })
    setSubmitError(null)
    setIsModalOpen(false)
  }

  const handleOpenEditModal = (outlet: Outlet) => {
    setEditingId(outlet.id)
    setEditFormData({
      name: outlet.name,
      areaId: outlet.areaId ?? '',
      address: outlet.address ?? '',
      latitude: outlet.latitude != null ? parseFloat(outlet.latitude) : null,
      longitude: outlet.longitude != null ? parseFloat(outlet.longitude) : null,
    })
    setEditError(null)
    setIsEditModalOpen(true)
  }

  const handleOpenDetailModal = (outlet: Outlet) => {
    setDetailOutlet(outlet)
    setIsDetailOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailOpen(false)
    setDetailOutlet(null)
  }

  const handleEditOutlet = async () => {
    if (!canUpdate(currentUser)) {
      setEditError(getPermissionDeniedMessage('update outlets'))
      return
    }

    if (!editFormData.name) {
      setEditError('Outlet name is required')
      return
    }

    try {
      setIsSubmitting(true)
      setEditError(null)
      if (!editingId) return

      const updatedOutlet = await updateOutlet(editingId, {
        name: editFormData.name,
        areaId: editFormData.areaId || null,
        address: editFormData.address,
        latitude: editFormData.latitude,
        longitude: editFormData.longitude,
      })

      setOutlets(outlets.map(outlet =>
        outlet.id === editingId ? updatedOutlet : outlet
      ))
      setEditFormData({ name: '', areaId: '', address: '', latitude: null, longitude: null })
      setEditingId(null)
      setIsEditModalOpen(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update outlet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseEditModal = () => {
    setEditFormData({ name: '', areaId: '', address: '', latitude: null, longitude: null })
    setEditingId(null)
    setEditError(null)
    setIsEditModalOpen(false)
  }

  const handleOpenConfirmModal = (outlet: Outlet, action: 'activate' | 'deactivate') => {
    setConfirmAction({ type: action, outlet })
    setIsConfirmModalOpen(true)
  }

  const handleConfirmToggleOutletStatus = async () => {
    if (!confirmAction) return

    if (!canToggleStatus(currentUser)) {
      alert(getPermissionDeniedMessage('toggle outlet status'))
      return
    }

    try {
      setTogglingId(confirmAction.outlet.id)
      let updatedOutlet

      if (confirmAction.type === 'deactivate') {
        updatedOutlet = await deactivateOutlet(confirmAction.outlet.id)
      } else {
        updatedOutlet = await activateOutlet(confirmAction.outlet.id)
      }

      setOutlets(outlets.map(o =>
        o.id === confirmAction.outlet.id ? updatedOutlet : o
      ))
      setIsConfirmModalOpen(false)
      setConfirmAction(null)
    } catch (err) {
      console.error('Failed to toggle outlet status:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false)
    setConfirmAction(null)
  }

  const filteredOutlets = useMemo(() => {
    return outlets.filter(
      (outlet) =>
        outlet.name.toLowerCase().includes(search.toLowerCase()) ||
        outlet.slug.toLowerCase().includes(search.toLowerCase())
    )
  }, [outlets, search])

  const totalPages = Math.max(1, Math.ceil(filteredOutlets.length / pageSize))
  const paginatedOutlets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredOutlets.slice(startIndex, startIndex + pageSize)
  }, [filteredOutlets, currentPage, pageSize])

  const columns: Column<Outlet>[] = [
    {
      key: 'name',
      header: 'Outlet Name',
      render: (outlet: Outlet) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shadow-sm">
            <Building2 className="text-indigo-600" size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{outlet.name}</p>
            <p className="text-xs text-gray-400 font-medium">ID: {outlet.id.substring(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      key: 'areaId',
      header: 'Area',
      className: 'hidden lg:table-cell',
      render: (outlet: Outlet) => {
        const area = areas.find((a) => a.id === outlet.areaId)
        return (
          <span className="text-sm font-semibold text-gray-700">
            {area ? area.name : <span className="text-gray-400 italic">No area</span>}
          </span>
        )
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (outlet: Outlet) => (
        <div>
          {outlet.isActive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg w-fit">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg w-fit">
              <XCircle size={16} className="text-red-600" />
              <span className="text-xs font-bold text-red-700">Inactive</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (outlet: Outlet) => (
        <div className="flex items-center gap-1">
          {canToggleStatus(currentUser) ? (
            outlet.isActive ? (
              <button
                onClick={() => handleOpenConfirmModal(outlet, 'deactivate')}
                disabled={togglingId === outlet.id}
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Deactivate"
              >
                {togglingId === outlet.id ? (
                  <Loader size={16} strokeWidth={2.5} className="animate-spin" />
                ) : (
                  <XCircle size={16} strokeWidth={2.5} />
                )}
              </button>
            ) : (
              <button
                onClick={() => handleOpenConfirmModal(outlet, 'activate')}
                disabled={togglingId === outlet.id}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Activate"
              >
                {togglingId === outlet.id ? (
                  <Loader size={16} strokeWidth={2.5} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                )}
              </button>
            )
          ) : (
            <button
              disabled
              className="p-2 text-gray-300 cursor-not-allowed"
              title="Only SUPER_ADMIN and COMPANY_ADMIN can toggle status"
            >
              <AlertCircle size={16} strokeWidth={2.5} />
            </button>
          )}
          <button
            disabled={!canUpdate(currentUser)}
            onClick={() => handleOpenEditModal(outlet)}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={canUpdate(currentUser) ? "Edit outlet" : "Only SUPER_ADMIN and COMPANY_ADMIN can edit"}
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleOpenDetailModal(outlet)}
            className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-all duration-200"
            title="View outlet detail"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Outlets</h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Manage all distribution points and locations
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
              {outlets.length} total
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate(currentUser) ? (
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus size={18} />
              Add Outlet
            </Button>
          ) : (
            <Button variant="primary" disabled title="Only SUPER_ADMIN and COMPANY_ADMIN can add outlets" className="gap-2">
              <Plus size={18} />
              Add Outlet
            </Button>
          )}
        </div>
      </div>

      <div className="relative group max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Search outlets by name or slug..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
          className="w-full pl-14 pr-6 py-4.5 bg-white border border-secondary-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold placeholder:text-secondary-400 placeholder:font-medium"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 bg-white rounded-2xl border border-secondary-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="text-center relative z-10">
            <div className="relative mb-6 mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Locating Outlets...</p>
            <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">Please wait a moment</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-32 bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-rose-50/30 opacity-50"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-lg shadow-rose-200">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2">Sync Error</h4>
            <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px] bg-rose-50 px-4 py-1.5 rounded-full inline-block mb-4">{error}</p>
            <p className="text-secondary-400 text-[11px] font-semibold italic max-w-xs mx-auto">Please check your connection and refresh.</p>
          </div>
        </div>
      ) : filteredOutlets.length > 0 ? (
        <>
          <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-secondary-200/50 overflow-hidden">
            <DataTable columns={columns} data={paginatedOutlets} />
          </div>

          {filteredOutlets.length > 0 && (
            <div className="bg-white px-8 py-6 rounded-2xl border border-secondary-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-secondary-200">
          <div className="w-24 h-24 bg-secondary-50 rounded-2xl flex items-center justify-center mb-6 text-secondary-200 border border-secondary-100">
            <Building2 size={40} strokeWidth={1} />
          </div>
          <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">No Outlets Found</p>
          <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">
            {search ? 'Try adjusting your search criteria' : 'Start by adding a new distribution point'}
          </p>
        </div>
      )}

      {/* Create Outlet Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Create New Outlet" maxWidthClassName="max-w-4xl">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Outlet Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g. main-outlet, jakarta-south"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Use lowercase letters, numbers, and hyphens only</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Outlet Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Main Outlet, Jakarta South Branch"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Display name for the outlet</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Area</label>
            <select
              value={formData.areaId}
              onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">No area</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Assign this outlet to a supervision area</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full outlet address"
              rows={3}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude ?? ''}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="-6.200000"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude ?? ''}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="106.816666"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Map Location</label>
              <LocationPicker
                lat={formData.latitude}
                lng={formData.longitude}
                onChange={(newLat, newLng) => setFormData({ ...formData, latitude: newLat, longitude: newLng })}
                height={460}
              />
              <p className="text-xs text-gray-500">Click on the map or drag the marker to set the outlet location</p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateOutlet}
              disabled={isSubmitting || !formData.slug || !formData.name}
              className="w-full"
            >
              {isSubmitting ? 'Creating...' : 'Create Outlet'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Outlet Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Outlet" maxWidthClassName="max-w-4xl">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Outlet Name</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              placeholder="e.g. Main Outlet, Jakarta South Branch"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Update the outlet name</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Area</label>
            <select
              value={editFormData.areaId}
              onChange={(e) => setEditFormData({ ...editFormData, areaId: e.target.value })}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">No area</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Reassign this outlet to a different area</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Address</label>
            <textarea
              value={editFormData.address}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              placeholder="Full outlet address"
              rows={3}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={editFormData.latitude ?? ''}
                onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="-6.200000"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={editFormData.longitude ?? ''}
                onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="106.816666"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Map Location</label>
              <LocationPicker
                lat={editFormData.latitude}
                lng={editFormData.longitude}
                onChange={(newLat, newLng) => setEditFormData({ ...editFormData, latitude: newLat, longitude: newLng })}
                height={460}
              />
              <p className="text-xs text-gray-500">Click on the map or drag the marker to update the outlet location</p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={handleCloseEditModal}
              disabled={isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditOutlet}
              disabled={isSubmitting || !editFormData.name}
              className="w-full"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Status Change Modal */}
      <Modal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} title="Confirm Action">
        <div className="space-y-6">
          <div className="space-y-3">
            {confirmAction?.type === 'deactivate' ? (
              <>
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">Deactivate Outlet</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Are you sure you want to deactivate <strong>{confirmAction.outlet.name}</strong>?
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  The outlet will be marked as inactive and may affect operations. You can reactivate it later if needed.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-900">Activate Outlet</p>
                    <p className="text-xs text-green-700 mt-1">
                      Are you sure you want to activate <strong>{confirmAction?.outlet.name}</strong>?
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  The outlet will be marked as active and ready for operations.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={handleCloseConfirmModal}
              disabled={togglingId !== null}
              className="w-full"
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction?.type === 'deactivate' ? 'danger' : 'primary'}
              onClick={handleConfirmToggleOutletStatus}
              disabled={togglingId !== null}
              className="w-full"
            >
              {togglingId ? 'Processing...' : confirmAction?.type === 'deactivate' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Outlet Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseDetailModal} title="Outlet Detail" maxWidthClassName="max-w-4xl">
        {detailOutlet && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Name</label>
              <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900">
                {detailOutlet.name}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Slug</label>
              <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900">
                {detailOutlet.slug}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Area</label>
              <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900">
                {areas.find((a) => a.id === detailOutlet.areaId)?.name ?? (
                  <span className="text-gray-400 italic font-medium">No area</span>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Address</label>
              <p className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 whitespace-pre-wrap">
                {detailOutlet.address || <span className="text-gray-400 italic font-medium">No address</span>}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Status</label>
              <div>
                {detailOutlet.isActive ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg w-fit">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg w-fit">
                    <XCircle size={16} className="text-red-600" />
                    <span className="text-xs font-bold text-red-700">Inactive</span>
                  </div>
                )}
              </div>
            </div>

            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Map Location</label>
              {detailOutlet.latitude != null && detailOutlet.longitude != null ? (
                <LocationPicker
                  lat={parseFloat(detailOutlet.latitude)}
                  lng={parseFloat(detailOutlet.longitude)}
                  height={420}
                />
              ) : (
                <p className="text-xs text-gray-500 italic px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  Koordinat belum diatur
                </p>
              )}
            </div>
          </div>

            <div className="pt-4 border-t border-gray-100">
              <Button variant="ghost" onClick={handleCloseDetailModal} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
