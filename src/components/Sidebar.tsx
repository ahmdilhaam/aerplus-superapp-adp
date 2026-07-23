import { NavLink, useLocation } from 'react-router-dom'
import { Users, X, Building2, MapPin, Lightbulb, RefreshCw, FileText, Calendar, ShieldCheck, ChevronDown, Database, ListChecks } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

type IconType = typeof Building2
type LeafItem = { label: string; path: string; icon: IconType }
type GroupItem = { label: string; icon: IconType; children: LeafItem[] }
type MenuItem = LeafItem | GroupItem

const isGroup = (item: MenuItem): item is GroupItem => 'children' in item

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // Get menu items based on user role
  const menuItems = useMemo<MenuItem[]>(() => {
    const userRole = user?.role || user?.companyRoles?.[0]

    // HOFO only sees Visits and Reports.
    if (userRole === 'HOFO') {
      return [
        { label: 'Visits', path: '/visit-schedule', icon: Calendar },
        { label: 'Reports', path: '/reports', icon: FileText },
      ]
    }

    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'COMPANY_ADMIN'
    const canViewInsights = isAdmin || userRole === 'OPERATION_MANAGER'
    // Sync Runs: SUPER_ADMIN only.
    const canViewSync = userRole === 'SUPER_ADMIN'
    const canViewReports = canViewInsights
    // Audit menu: Company Admin & Super Admin only (matches backend `audit.read` perm, v1.4).
    // OPERATION_MANAGER dikeluarkan (MoM 15 Juli 2026); HOFO/SPV juga tidak boleh.
    const canViewAudit = isAdmin

    const baseItems: MenuItem[] = []

    // Master Data: Areas (admin only, first) + Outlets, grouped under one parent.
    const masterChildren: LeafItem[] = []
    if (isAdmin) {
      masterChildren.push({ label: 'Areas', path: '/areas', icon: MapPin })
    }
    masterChildren.push({ label: 'Outlets', path: '/outlets', icon: Building2 })
    if (isAdmin) {
      masterChildren.push({ label: 'Checklist Visit', path: '/checklist-questions', icon: ListChecks })
    }
    if (masterChildren.length === 1) {
      baseItems.push(masterChildren[0])
    } else {
      baseItems.push({ label: 'Master Data', icon: Database, children: masterChildren })
    }

    if (isAdmin) {
      baseItems.push({ label: 'Visits', path: '/visit-schedule', icon: Calendar })
      baseItems.push({ label: 'Users', path: '/users', icon: Users })
    }
    if (canViewInsights) {
      baseItems.push({ label: 'Insight Rules', path: '/insight-rules', icon: Lightbulb })
    }
    if (canViewSync) {
      baseItems.push({ label: 'Sync Runs', path: '/sync-runs', icon: RefreshCw })
    }

    // Reports & Audit grouped under a single "Reports" parent.
    const reportChildren: LeafItem[] = []
    if (canViewReports) {
      reportChildren.push({ label: 'Visit Reports', path: '/reports', icon: FileText })
    }
    if (canViewAudit) {
      reportChildren.push({ label: 'Audit', path: '/audit', icon: ShieldCheck })
    }
    if (reportChildren.length === 1) {
      baseItems.push(reportChildren[0])
    } else if (reportChildren.length > 1) {
      baseItems.push({ label: 'Reports', icon: FileText, children: reportChildren })
    }

    return baseItems
  }, [user?.role, user?.companyRoles])

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
      ? 'bg-linear-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-600/30 font-semibold'
      : 'text-secondary-400 hover:bg-secondary-900 hover:text-secondary-100'
    }`

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-secondary-950 text-secondary-300 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 z-40 border-r border-secondary-800/50 shadow-2xl shadow-black/20`}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-secondary-800/50 flex items-center justify-between bg-secondary-950 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 tracking-tight">
              <div className="w-9 h-9 bg-linear-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-sm font-black italic text-white">A+</span>
              </div>
              AerPlus
            </h1>
            <p className="text-[10px] text-secondary-500 mt-1 uppercase tracking-[0.2em] font-semibold">Management Console</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-secondary-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto mt-4 px-3">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              if (isGroup(item)) {
                const GroupIcon = item.icon
                const childActive = item.children.some((c) => location.pathname.startsWith(c.path))
                const open = openGroups[item.label] ?? childActive
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => setOpenGroups((prev) => ({ ...prev, [item.label]: !(prev[item.label] ?? childActive) }))}
                      className={`w-full ${linkClass(false)}`}
                    >
                      <GroupIcon size={20} className="text-secondary-500 group-hover:text-secondary-100" />
                      <span className="text-sm flex-1 text-left"> {item.label}</span>
                      <ChevronDown size={16} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <ul className="mt-1 ml-4 pl-3 border-l border-secondary-800/60 space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          return (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                onClick={onClose}
                                className={({ isActive }) => linkClass(isActive)}
                              >
                                {({ isActive }) => (
                                  <>
                                    <ChildIcon size={18} className={isActive ? 'text-white' : 'text-secondary-500 group-hover:text-secondary-100'} />
                                    <span className="text-sm"> {child.label}</span>
                                  </>
                                )}
                              </NavLink>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }

              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => linkClass(isActive)}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={20} className={isActive ? 'text-white' : 'text-secondary-500 group-hover:text-secondary-100'} />
                        <span className="text-sm"> {item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
