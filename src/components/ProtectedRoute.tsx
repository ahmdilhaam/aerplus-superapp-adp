import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 mb-4 animate-spin">
            <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-indigo-400"></div>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/notfound" replace />
    }
  }

  return children
}
