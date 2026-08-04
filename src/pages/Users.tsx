import { useState, useMemo, useEffect } from 'react'
import { Search, Edit2, Mail, User as UserIcon, Shield, Building2, Loader, Lock, CheckCircle, XCircle, AlertCircle, CheckCircle2, ChevronDown, Eye, EyeOff } from 'lucide-react'
import type { User, Outlet, Area } from '../types'
import { getUsers, getOutlets, createUser, activateUser, deactivateUser, updateUser, updateUserRoles, getAreas } from '../services/api'
import { DataTable } from '../components/DataTable'
import { Pagination } from '../components/Pagination'
import { Badge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { MultiSelect } from '../components/MultiSelect'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { useAuth } from '../contexts/AuthContext'
import { canCreate, canUpdate, canToggleStatus, getPermissionDeniedMessage } from '../utils/permissions'

const PAGE_SIZE_OPTIONS = [10, 50, 100]

const RequiredMark = () => <span className="text-rose-500 ml-0.5" title="Wajib diisi">*</span>
const OptionalMark = () => <span className="ml-1.5 text-[9px] font-semibold text-gray-400 normal-case tracking-normal">(optional)</span>

interface AddUserForm {
  username: string
  password: string
  name: string
  phone: string
  address: string
  areaId: string
  role: string
  outlets: string[]
}

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  // Default sembunyikan user nonaktif; admin bisa menampilkannya lagi lewat filter
  // ini (mis. untuk reaktivasi) tanpa kehilangan akses.
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<AddUserForm>({
    username: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    areaId: '',
    role: 'STAFF',
    outlets: [],
  })
  const [showAddPassword, setShowAddPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  // `role` tidak bisa diubah dari modal ini — disimpan hanya agar aturan wajib/opsional
  // kolom Area di sini persis sama dengan modal Add User & Change Roles.
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', address: '', password: '', areaId: '', role: 'STAFF' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [roleEditingUserId, setRoleEditingUserId] = useState<string | null>(null)
  const [roleFormData, setRoleFormData] = useState({ companyRole: 'STAFF', outlets: [] as string[], areaId: '' })
  const [roleError, setRoleError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'activate' | 'deactivate'; user: User } | null>(null)

  // Fetch users and outlets on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [usersData, outletsData, areasData] = await Promise.all([
          getUsers(),
          getOutlets(),
          getAreas(),
        ])
        setUsers(usersData)
        setOutlets(outletsData)
        setAreas(areasData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
        console.error('Error fetching users:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        (user.username?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? user.isActive : !user.isActive)
      return matchesSearch && matchesStatus
    })
  }, [search, users, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredUsers.slice(startIndex, startIndex + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  const statusVariant = (
    isActive?: boolean
  ): 'success' | 'warning' | 'error' | 'info' => {
    return isActive ? 'success' : 'error'
  }

  const getAllAvailableRoles = () => {
    const allRoles = [
      { value: 'SUPER_ADMIN', label: 'Super Admin' },
      { value: 'COMPANY_ADMIN', label: 'Company Admin' },
      { value: 'OPERATION_MANAGER', label: 'Operation Manager' },
      { value: 'AREA_MANAGER', label: 'Area Manager' },
      { value: 'HOFO', label: 'HOFO' },
      { value: 'AREA_SUPERVISOR', label: 'Area Supervisor' },
      { value: 'SUPERVISOR', label: 'Supervisor' },
      { value: 'OUTLET_ADMIN', label: 'Outlet Admin' },
      { value: 'STAFF', label: 'Staff' },
      { value: 'AUDIT', label: 'Audit' },
    ]

    // If current user is COMPANY_ADMIN, exclude SUPER_ADMIN from available roles
    if (currentUser?.role === 'COMPANY_ADMIN') {
      return allRoles.filter(role => role.value !== 'SUPER_ADMIN')
    }

    return allRoles
  }

  // Role company-wide yang tidak butuh assignment area/outlet.
  // AUDIT = company-scoped + akses company-wide (companyWideOutletAccessRoles di backend).
  const roleRequiresOutlet = (role: string) => role !== 'AUDIT'
  // v1.4: AUDIT boleh diberi area (OPSIONAL) — menyiapkan audit per-area.
  // Area kosong = auditor mencakup SEMUA area (company-wide, perilaku default saat ini).
  const roleSupportsArea = (role: string) => roleRequiresOutlet(role) || role === 'AUDIT'
  // Aturan tunggal kolom Area, dipakai identik oleh Add User, Edit User & Change Roles:
  // wajib untuk semua role kecuali AUDIT (AUDIT kosong = mencakup semua area).
  const roleRequiresArea = (role: string) => roleSupportsArea(role) && role !== 'AUDIT'
  const AREA_REQUIRED_MESSAGE = 'Please select an area'
  // Backend memvalidasi areaId sebagai UUID; string kosong harus dikirim sebagai null,
  // bukan '' (kalau tidak, request ditolak 400 oleh zod).
  const normalizeAreaId = (role: string, areaId: string) =>
    roleSupportsArea(role) ? areaId || null : null

  const roleColor = (roles?: string[]): string => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'bg-rose-50 text-rose-600 border-rose-100',
      COMPANY_ADMIN: 'bg-purple-50 text-purple-600 border-purple-100',
      OPERATION_MANAGER: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      AREA_MANAGER: 'bg-blue-50 text-blue-600 border-blue-100',
      HOFO: 'bg-violet-50 text-violet-600 border-violet-100',
      AREA_SUPERVISOR: 'bg-amber-50 text-amber-600 border-amber-100',
      SUPERVISOR: 'bg-yellow-50 text-yellow-600 border-yellow-100',
      OUTLET_ADMIN: 'bg-teal-50 text-teal-600 border-teal-100',
      STAFF: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      AUDIT: 'bg-slate-50 text-slate-600 border-slate-100',
    }
    const primaryRole = roles?.[0] || 'STAFF'
    return roleMap[primaryRole] || 'bg-gray-50 text-gray-600 border-gray-100'
  }

  const handleAddUser = async () => {
    if (!canCreate(currentUser)) {
      alert(getPermissionDeniedMessage('create users'))
      return
    }

    if (!formData.username || !formData.password || !formData.name || !formData.phone || !formData.address) {
      return
    }
    if (roleRequiresArea(formData.role) && !formData.areaId) {
      return
    }
    if (roleRequiresOutlet(formData.role) && formData.outlets.length === 0) {
      return
    }

    try {
      setIsSubmitting(true)

      const createUserData = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        areaId: normalizeAreaId(formData.role, formData.areaId),
        avatarUrl: '',
        companyRoles: [formData.role],
        outletRoles: roleRequiresOutlet(formData.role)
          ? formData.outlets.map(outletId => ({
              outletId,
              role: 'OUTLET_ADMIN' as const,
            }))
          : [],
      }

      await createUser(createUserData)

      // Refresh users list
      const usersData = await getUsers()
      setUsers(usersData)

      // Reset form and close modal
      setFormData({ username: '', password: '', name: '', phone: '', address: '', areaId: '', role: 'STAFF', outlets: [] })
      setShowAddPassword(false)
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error creating user:', err)
      alert(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenConfirmModal = (user: User, action: 'activate' | 'deactivate') => {
    setConfirmAction({ type: action, user })
    setIsConfirmModalOpen(true)
  }

  const handleConfirmToggleUserStatus = async () => {
    if (!confirmAction) return

    if (!canToggleStatus(currentUser)) {
      alert(getPermissionDeniedMessage('toggle user status'))
      return
    }

    try {
      setTogglingId(confirmAction.user.id)

      if (confirmAction.type === 'deactivate') {
        await deactivateUser(confirmAction.user.id)
      } else {
        await activateUser(confirmAction.user.id)
      }

      // Refresh users list
      const usersData = await getUsers()
      setUsers(usersData)

      setIsConfirmModalOpen(false)
      setConfirmAction(null)
    } catch (err) {
      console.error('Failed to toggle user status:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false)
    setConfirmAction(null)
  }

  const handleOpenEditModal = (user: User) => {
    setEditingUserId(user.id)
    setEditFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      password: '',
      areaId: user.areaId || '',
      role: user.companyRoles?.[0] || 'STAFF',
    })
    setEditError(null)
    setShowEditPassword(false)
    setIsEditModalOpen(true)
  }

  const handleEditUser = async () => {
    if (!canUpdate(currentUser)) {
      setEditError(getPermissionDeniedMessage('update users'))
      return
    }

    if (!editFormData.name) {
      setEditError('User name is required')
      return
    }
    if (roleRequiresArea(editFormData.role) && !editFormData.areaId) {
      setEditError(AREA_REQUIRED_MESSAGE)
      return
    }

    try {
      setIsSubmitting(true)
      setEditError(null)
      if (!editingUserId) return

      const updateData = {
        name: editFormData.name,
        phone: editFormData.phone,
        address: editFormData.address,
        areaId: normalizeAreaId(editFormData.role, editFormData.areaId),
        ...(editFormData.password && { password: editFormData.password }),
      }

      await updateUser(editingUserId, updateData)

      // Refresh users list
      const usersData = await getUsers()
      setUsers(usersData)

      setEditFormData({ name: '', phone: '', address: '', password: '', areaId: '', role: 'STAFF' })
      setEditingUserId(null)
      setIsEditModalOpen(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseEditModal = () => {
    setEditFormData({ name: '', phone: '', address: '', password: '', areaId: '', role: 'STAFF' })
    setEditingUserId(null)
    setEditError(null)
    setShowEditPassword(false)
    setIsEditModalOpen(false)
  }

  const handleOpenRoleModal = (user: User) => {
    setRoleEditingUserId(user.id)
    setRoleFormData({
      companyRole: user.companyRoles?.[0] || 'STAFF',
      outlets: user.outletRoles?.map(or => or.outletId) || [],
      areaId: user.areaId || '',
    })
    setRoleError(null)
    setIsRoleModalOpen(true)
  }

  const handleUpdateRoles = async () => {
    if (!canUpdate(currentUser)) {
      setRoleError(getPermissionDeniedMessage('update user roles'))
      return
    }

    if (!roleFormData.companyRole) {
      setRoleError('Please select a role')
      return
    }
    if (roleRequiresArea(roleFormData.companyRole) && !roleFormData.areaId) {
      setRoleError(AREA_REQUIRED_MESSAGE)
      return
    }
    if (roleRequiresOutlet(roleFormData.companyRole) && roleFormData.outlets.length === 0) {
      setRoleError('Please select at least one outlet')
      return
    }

    try {
      setIsSubmitting(true)
      setRoleError(null)
      if (!roleEditingUserId) return

      await updateUserRoles(roleEditingUserId, {
        areaId: normalizeAreaId(roleFormData.companyRole, roleFormData.areaId),
        companyRoles: [roleFormData.companyRole],
        outletRoles: roleRequiresOutlet(roleFormData.companyRole)
          ? roleFormData.outlets.map(outletId => ({
              outletId,
              role: 'OUTLET_ADMIN' as const,
            }))
          : [],
      })

      // Refresh users list
      const usersData = await getUsers()
      setUsers(usersData)

      setRoleFormData({ companyRole: 'STAFF', outlets: [], areaId: '' })
      setRoleEditingUserId(null)
      setIsRoleModalOpen(false)
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Failed to update user roles')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseRoleModal = () => {
    setRoleFormData({ companyRole: 'STAFF', outlets: [], areaId: '' })
    setRoleEditingUserId(null)
    setRoleError(null)
    setIsRoleModalOpen(false)
  }

  const columns = [
    {
      key: 'name' as const,
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold border border-indigo-100">
            <ImageWithFallback
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full rounded-xl object-cover"
              fallback={<>{user.name.charAt(0) || user.username?.charAt(0) || 'U'}</>}
            />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">{user.name || user.username}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{user.username || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role' as const,
      header: 'Role Authority',
      render: (user: User) => (
        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${roleColor(user.companyRoles)}`}>
          {user.companyRoles?.[0]?.replace('_', ' ') || 'STAFF'}
        </span>
      ),
    },
    {
      key: 'isActive' as const,
      header: 'Account Status',
      render: (user: User) => <Badge variant={statusVariant(user.isActive)} label={user.isActive ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'createdAt' as const,
      header: 'Member Since',
      className: 'hidden lg:table-cell',
      render: (user: User) => (
        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
        </span>
      ),
    },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (user: User) => (
        <div className="flex items-center gap-1">
          {canToggleStatus(currentUser) ? (
            user.isActive ? (
              <button
                onClick={() => handleOpenConfirmModal(user, 'deactivate')}
                disabled={togglingId === user.id}
                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Deactivate"
              >
                {togglingId === user.id ? (
                  <Loader size={16} strokeWidth={2.5} className="animate-spin" />
                ) : (
                  <XCircle size={16} strokeWidth={2.5} />
                )}
              </button>
            ) : (
              <button
                onClick={() => handleOpenConfirmModal(user, 'activate')}
                disabled={togglingId === user.id}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Activate"
              >
                {togglingId === user.id ? (
                  <Loader size={16} strokeWidth={2.5} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} strokeWidth={2.5} />
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
            onClick={() => handleOpenRoleModal(user)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={canUpdate(currentUser) ? "Change Role" : "Only SUPER_ADMIN and COMPANY_ADMIN can change roles"}
          >
            <Shield size={16} strokeWidth={2.5} />
          </button>
          <button
            disabled={!canUpdate(currentUser)}
            onClick={() => handleOpenEditModal(user)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title={canUpdate(currentUser) ? "Edit" : "Only SUPER_ADMIN and COMPANY_ADMIN can edit"}
          >
            <Edit2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary-900 tracking-tight">Users</h1>
          <p className="text-secondary-500 font-medium mt-2 flex items-center gap-2">
            Manage platform access and member roles
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-200/50">
              {filteredUsers.length} total
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canCreate(currentUser) ? (
            <Button variant="primary" onClick={() => { setShowAddPassword(false); setIsModalOpen(true) }} className="gap-2">
              <UserIcon size={18} />
              Add User
            </Button>
          ) : (
            <Button variant="primary" disabled title="Only SUPER_ADMIN and COMPANY_ADMIN can add users" className="gap-2">
              <UserIcon size={18} />
              Add User
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative group w-full sm:max-w-2xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-14 pr-6 py-4.5 bg-white border border-secondary-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold placeholder:text-secondary-400 placeholder:font-medium"
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'active' | 'inactive' | 'all')
              setCurrentPage(1)
            }}
            className="w-full sm:w-48 appearance-none pl-5 pr-12 py-4 bg-white border border-secondary-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all text-sm font-semibold text-secondary-700 cursor-pointer"
            title="Filter status user"
          >
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="all">Semua</option>
          </select>
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32 bg-white rounded-3xl border border-secondary-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-primary-50 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="text-center relative z-10">
            <div className="relative mb-6 mx-auto w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-secondary-900 font-black uppercase tracking-[0.2em] text-xs">Synchronizing database...</p>
            <p className="text-secondary-400 text-[10px] font-bold mt-2 italic">Please wait a moment</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-32 bg-white rounded-3xl border border-primary-100 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-rose-50/30 opacity-50"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-lg shadow-rose-200">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black text-secondary-900 tracking-tight mb-2">Sync Connection Error</h4>
            <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px] bg-rose-50 px-4 py-1.5 rounded-full inline-block mb-4">{error}</p>
            <p className="text-secondary-400 text-[11px] font-semibold italic max-w-xs mx-auto">Our systems are having trouble reaching the server. Please check your connection.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <DataTable columns={columns} data={paginatedUsers} />
          </div>

          {filteredUsers.length > 0 && (
            <div className="bg-white px-8 py-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Per page</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all text-sm font-semibold text-gray-700"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              )}
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-300" size={24} />
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No users found matching "{search}"</p>
              <p className="text-gray-400 text-[10px] mt-1 font-medium italic">Try adjusting your filters</p>
            </div>
          )}
        </>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setShowAddPassword(false); setIsModalOpen(false) }} title="Add New User">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username <RequiredMark /></label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. johnsmith"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password <RequiredMark /></label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type={showAddPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter secure password"
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowAddPassword(!showAddPassword)}
                title={showAddPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {showAddPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assigned Role <RequiredMark /></label>
            <div className="relative group">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer"
              >
                {getAllAvailableRoles().map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name <RequiredMark /></label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone <RequiredMark /></label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 08211234567"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address <RequiredMark /></label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Jl Tanjung Duren III"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {roleSupportsArea(formData.role) && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Area {roleRequiresArea(formData.role) ? <RequiredMark /> : <OptionalMark />}</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <select
                value={formData.areaId}
                onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer"
              >
                <option value="">{formData.role === 'AUDIT' ? 'Semua area (default)' : 'Select an area...'}</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {formData.role === 'AUDIT' && (
              <p className="text-[10px] text-gray-400 ml-1">Kosongkan agar auditor mencakup semua area.</p>
            )}
          </div>
          )}

          {roleRequiresOutlet(formData.role) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2 ml-1">
              <Building2 size={14} className="text-gray-400" />
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Control <RequiredMark /></label>
            </div>
            <MultiSelect
              options={outlets.map((outlet) => ({
                id: outlet.id,
                name: `${outlet.name} (${outlet.slug})`,
              }))}
              selectedIds={formData.outlets}
              onChange={(selectedIds) => setFormData({ ...formData, outlets: selectedIds })}
              placeholder="Assign to one or more outlets..."
            />
            {formData.outlets.length === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">At least one access location is required</p>
              </div>
            )}
          </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-50">
            <Button variant="ghost" onClick={() => { setShowAddPassword(false); setIsModalOpen(false) }} className="w-full" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddUser}
              disabled={!formData.username || !formData.password || !formData.name || !formData.phone || !formData.address || (roleRequiresArea(formData.role) && !formData.areaId) || (roleRequiresOutlet(formData.role) && formData.outlets.length === 0) || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Creating...' : 'Confirm & Add User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit User">
        <div className="space-y-6">
          {editError && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-rose-600 font-bold text-sm">Error</span>
              <p className="text-rose-600 text-xs">{editError}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name <RequiredMark /></label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g. John Doe Updated"
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone <OptionalMark /></label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="e.g. 08219998887777"
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address <OptionalMark /></label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="e.g. Jl Baru No 10"
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {roleSupportsArea(editFormData.role) && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Area {roleRequiresArea(editFormData.role) ? <RequiredMark /> : <OptionalMark />}</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <select
                value={editFormData.areaId}
                onChange={(e) => setEditFormData({ ...editFormData, areaId: e.target.value })}
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{editFormData.role === 'AUDIT' ? 'Semua area (default)' : 'Select an area...'}</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {editFormData.role === 'AUDIT' && (
              <p className="text-[10px] text-gray-400 ml-1">Kosongkan agar auditor mencakup semua area.</p>
            )}
          </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password <OptionalMark /></label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type={showEditPassword ? 'text' : 'password'}
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                disabled={isSubmitting}
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                disabled={isSubmitting}
                title={showEditPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">Only fill if you want to change the password</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-50">
            <Button variant="ghost" onClick={handleCloseEditModal} className="w-full" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditUser}
              disabled={!editFormData.name || (roleRequiresArea(editFormData.role) && !editFormData.areaId) || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change User Roles Modal */}
      <Modal isOpen={isRoleModalOpen} onClose={handleCloseRoleModal} title="Change User Roles">
        <div className="space-y-6">
          {roleError && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <span className="text-rose-600 font-bold text-sm">Error</span>
              <p className="text-rose-600 text-xs">{roleError}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Company Role <RequiredMark /></label>
            <div className="relative group">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <select
                value={roleFormData.companyRole}
                onChange={(e) => setRoleFormData({ ...roleFormData, companyRole: e.target.value })}
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getAllAvailableRoles().map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {roleSupportsArea(roleFormData.companyRole) && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Area {roleRequiresArea(roleFormData.companyRole) ? <RequiredMark /> : <OptionalMark />}</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <select
                value={roleFormData.areaId}
                onChange={(e) => setRoleFormData({ ...roleFormData, areaId: e.target.value })}
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{roleFormData.companyRole === 'AUDIT' ? 'Semua area (default)' : 'Select an area...'}</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            {roleFormData.companyRole === 'AUDIT' && (
              <p className="text-[10px] text-gray-400 ml-1">Kosongkan agar auditor mencakup semua area.</p>
            )}
          </div>
          )}

          {(
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2 ml-1">
              <Building2 size={14} className="text-gray-400" />
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned Outlets <RequiredMark /></label>
            </div>
            <MultiSelect
              options={outlets.map((outlet) => ({
                id: outlet.id,
                name: `${outlet.name} (${outlet.slug})`,
              }))}
              selectedIds={roleFormData.outlets}
              onChange={(selectedIds) => setRoleFormData({ ...roleFormData, outlets: selectedIds })}
              placeholder="Assign to one or more outlets..."
            />
            {roleFormData.outlets.length === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 rounded-xl border border-rose-100 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">At least one outlet is required</p>
              </div>
            )}
          </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-50">
            <Button variant="ghost" onClick={handleCloseRoleModal} className="w-full" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateRoles}
              disabled={!roleFormData.companyRole || (roleRequiresArea(roleFormData.companyRole) && !roleFormData.areaId) || (roleRequiresOutlet(roleFormData.companyRole) && roleFormData.outlets.length === 0) || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Updating...' : 'Update Roles'}
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
                    <p className="text-sm font-bold text-amber-900">Deactivate User</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Are you sure you want to deactivate <strong>{confirmAction.user.name || confirmAction.user.username}</strong>?
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  The user will be marked as inactive and will not be able to access the system. You can reactivate them later if needed.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-900">Activate User</p>
                    <p className="text-xs text-green-700 mt-1">
                      Are you sure you want to activate <strong>{confirmAction?.user.name || confirmAction?.user.username}</strong>?
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  The user will be marked as active and can access the system.
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
              onClick={handleConfirmToggleUserStatus}
              disabled={togglingId !== null}
              className="w-full"
            >
              {togglingId ? 'Processing...' : confirmAction?.type === 'deactivate' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
