import type { User, UserRole } from '../types'

// Roles allowed to perform create, update, delete operations
const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'COMPANY_ADMIN']

/**
 * Check if user has permission to create resources
 * Only SUPER_ADMIN and COMPANY_ADMIN can create
 */
export const canCreate = (user: User | null): boolean => {
  if (!user) return false
  const userRole = user.role as UserRole
  return ADMIN_ROLES.includes(userRole)
}

/**
 * Check if user has permission to update resources
 * Only SUPER_ADMIN and COMPANY_ADMIN can update
 */
export const canUpdate = (user: User | null): boolean => {
  if (!user) return false
  const userRole = user.role as UserRole
  return ADMIN_ROLES.includes(userRole)
}

/**
 * Check if user has permission to delete resources
 * Only SUPER_ADMIN and COMPANY_ADMIN can delete
 */
export const canDelete = (user: User | null): boolean => {
  if (!user) return false
  const userRole = user.role as UserRole
  return ADMIN_ROLES.includes(userRole)
}

/**
 * Check if user has permission to activate/deactivate users
 * Only SUPER_ADMIN and COMPANY_ADMIN can toggle status
 */
export const canToggleStatus = (user: User | null): boolean => {
  if (!user) return false
  const userRole = user.role as UserRole
  return ADMIN_ROLES.includes(userRole)
}

/**
 * Check if user has any admin permission (create, update, or delete)
 */
export const hasAdminPermission = (user: User | null): boolean => {
  return canCreate(user) || canUpdate(user) || canDelete(user)
}

/**
 * Get permission error message
 */
export const getPermissionDeniedMessage = (action: string): string => {
  return `You don't have permission to ${action}. Only SUPER_ADMIN and COMPANY_ADMIN can perform this action.`
}
