import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface HeaderProps {
  onMenuClick?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const role = user?.role || user?.companyRoles?.[0]
  const isAdmin = role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN'

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  // Get page title from path
  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      '/': 'Dashboard',
      '/areas': 'Areas',
      '/outlets': 'Outlets',
      '/users': 'Users',
      '/visits': 'Visits',
      '/settings': 'Settings',
      '/company-settings': 'Company Settings',
    }
    return pathMap[location.pathname] || 'Page'
  }

  // Get user initials
  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase()
  }

  return (
    <header className="fixed right-0 top-0 left-0 md:left-64 h-20 bg-white/70 backdrop-blur-xl border-b border-secondary-200/50 z-30 transition-all duration-300">
      <div className="h-full px-4 md:px-10 flex items-center justify-between">
        {/* Left side - Page title & Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-1 text-secondary-500 hover:bg-secondary-100 rounded-xl md:hidden transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-primary-600 rounded-full hidden md:block"></div>
            <h2 className="text-lg md:text-xl font-extrabold text-secondary-900 tracking-tight transition-all duration-300 truncate max-w-37.5 md:max-w-none">
              {getPageTitle()}
            </h2>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2 pl-4 md:pl-6">
            {/* User profile + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-secondary-50 transition-all duration-300 group border border-transparent hover:border-secondary-200"
              >
                <div className="w-9 h-9 bg-linear-to-br from-primary-50 to-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm group-hover:from-primary-600 group-hover:to-primary-700 group-hover:text-white transition-all duration-500">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-secondary-900 leading-none">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-widest mt-1">{role ? role.toLowerCase().replace('_', ' ') : 'User'}</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-secondary-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-secondary-100 shadow-xl shadow-secondary-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/company-settings')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-secondary-600 hover:bg-secondary-50 transition-colors text-sm font-semibold"
                    >
                      <Settings size={18} className="text-secondary-400" />
                      Company Settings
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-semibold"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
