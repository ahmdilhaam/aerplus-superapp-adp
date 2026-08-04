import type {
  VisitOverview,
  VisitScheduleResponse,
  VisitHistory,
  ChecklistQuestion,
  AdminChecklistQuestion,
  Outlet,
  User,
  Area,
  Company,
  InsightRule,
  InsightRuleType,
  InsightSeverity,
  InsightRuleConfig,
  SyncRun,
  SyncSource,
  SyncStatus,
  SyncState,
  VisitReportListResponse,
  VisitReportDetail,
  AdminVisitScheduleResponse,
  AuditReportListResponse,
  AuditReportDetailResponse,
} from '../types'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://aerplus-superapp-api.qyubit.io'

export interface LoginRequest {
  username: string
  password: string
  companySlug?: string
}

export interface LoginResponse {
  success: boolean
  message?: string
  data?: {
    accessToken: string
    refreshToken: string
    user?: User
    kontakSpvArea?: {
      phone: string
    }
    depots?: Array<{
      id: string
      name: string
    }>
  }
  error?: string
}

const ACCESS_TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refreshToken'

// Helper functions to read/write auth tokens
const getAuthToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY)
const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY)

export const setAuthTokens = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

// Clear the session and send the user back to login (used when refresh fails)
const clearSessionAndRedirect = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem('user')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export interface RefreshResponse {
  success: boolean
  message?: string
  data?: {
    accessToken: string
    refreshToken: string
  }
  error?: string
}

// Exchange the stored refresh token for a fresh access token (with rotation).
// Returns the new access token, or null if the refresh could not be performed.
export const refreshTokenAPI = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) return null

    const body: RefreshResponse = await response.json()
    if (body.success && body.data?.accessToken) {
      setAuthTokens(body.data.accessToken, body.data.refreshToken)
      return body.data.accessToken
    }
    return null
  } catch {
    return null
  }
}

// Single-flight refresh: concurrent 401s share one refresh request instead of
// each firing their own (which would race and invalidate the rotated token).
let refreshPromise: Promise<string | null> | null = null
const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshTokenAPI().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

// Helper function for authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}, allowRetry = true): Promise<any> => {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Access token likely expired: refresh once, then retry the original request.
  if (response.status === 401 && allowRetry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return fetchWithAuth(url, options, false)
    }
    clearSessionAndRedirect()
    throw new Error('Session expired. Please log in again.')
  }

  if (!response.ok) {
    // Try to extract a friendly message from the backend's standard error envelope:
    //   { success: false, message: "...", error: { code, status, details } }
    let message = `HTTP error! status: ${response.status}`
    try {
      const body = await response.json()
      if (body?.message) message = body.message
      else if (body?.error?.message) message = body.error.message
    } catch {
      // body was not JSON; keep the default message
    }
    throw new Error(message)
  }

  return await response.json()
}

// Login API
export const loginAPI = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    }
  }
}

// Get current user data API
export const getMeAPI = async (): Promise<User | null> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/me`)
    // Extract user from nested response structure: response.data.user
    return response.data?.user || response.user || response || null
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    return null
  }
}

// Visits API
export const getVisitOverview = async (): Promise<VisitOverview> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/visits/overview`)
  // Handle API response wrapper
  return response.data || response
}

export const getVisitSchedule = async (): Promise<VisitScheduleResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/visits/schedule`)
  // Handle API response wrapper
  return response.data || response
}

export const getVisitHistory = async (): Promise<VisitHistory[]> => {
  return fetchWithAuth(`${API_BASE_URL}/api/visits/history`)
}

export const getChecklistQuestions = async (): Promise<ChecklistQuestion[]> => {
  return fetchWithAuth(`${API_BASE_URL}/api/visits/checklist/questions`)
}

// Users API
export interface CreateUserRequest {
  username: string
  password: string
  name: string
  phone: string
  address: string
  areaId: string | null
  avatarUrl: string
  companyRoles: string[]
  outletRoles: Array<{
    outletId: string
    role: 'OUTLET_ADMIN'
  }>
}

export interface UpdateUserRequest {
  name?: string
  phone?: string
  address?: string
  password?: string
}

export interface UpdateUserRolesRequest {
  areaId: string | null
  companyRoles: string[]
  outletRoles: Array<{
    outletId: string
    role: string
  }>
}

export const getUsers = async (role?: string): Promise<User[]> => {
  const url = role
    ? `${API_BASE_URL}/api/admin/users?role=${encodeURIComponent(role)}`
    : `${API_BASE_URL}/api/admin/users`
  const response = await fetchWithAuth(url)
  // Handle API response wrapper
  return response.data || response
}

export const createUser = async (userData: CreateUserRequest): Promise<User> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/users`, {
    method: 'POST',
    body: JSON.stringify(userData),
  })
  // Handle API response wrapper
  return response.data || response
}

export const activateUser = async (userId: string): Promise<User> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${userId}/activate`, {
    method: 'PATCH',
  })
  // Handle API response wrapper
  return response.data || response
}

export const deactivateUser = async (userId: string): Promise<User> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${userId}/deactivate`, {
    method: 'PATCH',
  })
  // Handle API response wrapper
  return response.data || response
}

export const updateUser = async (userId: string, payload: UpdateUserRequest): Promise<User> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  // Handle API response wrapper
  return response.data || response
}

export const updateUserRoles = async (userId: string, payload: UpdateUserRolesRequest): Promise<User> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/users/${userId}/roles`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  // Handle API response wrapper
  return response.data || response
}

// Outlets API
export const getOutlets = async (): Promise<Outlet[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/outlets`)
  // Handle API response wrapper
  return response.data || response
}

export interface CreateOutletRequest {
  slug: string
  name: string
  areaId?: string | null
  address?: string
  latitude?: number | null
  longitude?: number | null
}

export interface UpdateOutletRequest {
  name?: string
  areaId?: string | null
  address?: string
  latitude?: number | null
  longitude?: number | null
}

export const createOutlet = async (payload: CreateOutletRequest): Promise<Outlet> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/outlets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  // Handle API response wrapper
  return response.data || response
}

export const updateOutlet = async (outletId: string, payload: UpdateOutletRequest): Promise<Outlet> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/outlets/${outletId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  // Handle API response wrapper
  return response.data || response
}

export const activateOutlet = async (outletId: string): Promise<Outlet> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/outlets/${outletId}/activate`, {
    method: 'PATCH',
  })
  // Handle API response wrapper
  return response.data || response
}

export const deactivateOutlet = async (outletId: string): Promise<Outlet> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/outlets/${outletId}/deactivate`, {
    method: 'PATCH',
  })
  // Handle API response wrapper
  return response.data || response
}

// Areas API
export interface CreateAreaRequest {
  name: string
  spvAreaUserId: string
}

export interface UpdateAreaRequest {
  name: string
  spvAreaUserId: string
}

export const getAreas = async (): Promise<Area[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/areas`)
  // Handle API response wrapper
  return response.data || response
}

export const createArea = async (payload: CreateAreaRequest): Promise<Area> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/areas`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  // Handle API response wrapper
  return response.data || response
}

export const updateArea = async (areaId: string, payload: UpdateAreaRequest): Promise<Area> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/areas/${areaId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  // Handle API response wrapper
  return response.data || response
}

export const deleteArea = async (areaId: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/api/admin/areas/${areaId}`, {
    method: 'DELETE',
  })
}

// Visit Checklist Questions API (master data)
export interface CreateChecklistQuestionRequest {
  category: string
  section: string
  question: string
  weight?: number
  isActive?: boolean
}

export interface UpdateChecklistQuestionRequest {
  category?: string
  section?: string
  question?: string
  weight?: number
  sortOrder?: number
  isActive?: boolean
}

export const getAdminChecklistQuestions = async (filters?: {
  category?: string
  section?: string
  isActive?: boolean
}): Promise<AdminChecklistQuestion[]> => {
  const params = new URLSearchParams()
  if (filters?.category) params.set('category', filters.category)
  if (filters?.section) params.set('section', filters.section)
  if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive))
  const qs = params.toString()
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/admin/checklist-questions${qs ? `?${qs}` : ''}`
  )
  return response.data || response
}

export const createAdminChecklistQuestion = async (
  payload: CreateChecklistQuestionRequest
): Promise<AdminChecklistQuestion> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/checklist-questions`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.data || response
}

export const updateAdminChecklistQuestion = async (
  id: string,
  payload: UpdateChecklistQuestionRequest
): Promise<AdminChecklistQuestion> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/checklist-questions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.data || response
}

export const deleteAdminChecklistQuestion = async (id: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/api/admin/checklist-questions/${id}`, {
    method: 'DELETE',
  })
}

export const getChecklistCategories = async (): Promise<string[]> => {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/admin/checklist-questions/meta/categories`
  )
  return response.data || response
}

export const getChecklistSections = async (category?: string): Promise<string[]> => {
  const qs = category ? `?category=${encodeURIComponent(category)}` : ''
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/admin/checklist-questions/meta/sections${qs}`
  )
  return response.data || response
}

// Insight Rules API
export interface CreateInsightRuleRequest {
  ruleType: InsightRuleType
  config: InsightRuleConfig
  severity: InsightSeverity
  enabled?: boolean
  titleTemplate: string
  descriptionTemplate: string
  sortOrder?: number
}

export interface UpdateInsightRuleRequest {
  ruleType?: InsightRuleType
  config?: InsightRuleConfig
  severity?: InsightSeverity
  enabled?: boolean
  titleTemplate?: string
  descriptionTemplate?: string
  sortOrder?: number
}

export const getInsightRules = async (): Promise<InsightRule[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/insight-rules`)
  return response.data || response
}

export const getInsightRule = async (ruleId: string): Promise<InsightRule> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/insight-rules/${ruleId}`)
  return response.data || response
}

export const createInsightRule = async (payload: CreateInsightRuleRequest): Promise<InsightRule> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/insight-rules`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.data || response
}

export const updateInsightRule = async (
  ruleId: string,
  payload: UpdateInsightRuleRequest,
): Promise<InsightRule> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/insight-rules/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.data || response
}

export const deleteInsightRule = async (ruleId: string): Promise<void> => {
  await fetchWithAuth(`${API_BASE_URL}/api/admin/insight-rules/${ruleId}`, {
    method: 'DELETE',
  })
}

// Sync Runs API
export interface SyncRunsQuery {
  source?: SyncSource
  status?: SyncStatus
  limit?: number
}

export const getSyncRuns = async (query: SyncRunsQuery = {}): Promise<SyncRun[]> => {
  const params = new URLSearchParams()
  if (query.source) params.set('source', query.source)
  if (query.status) params.set('status', query.status)
  if (query.limit !== undefined) params.set('limit', String(query.limit))
  const qs = params.toString()
  const url = `${API_BASE_URL}/api/admin/sync-runs${qs ? `?${qs}` : ''}`
  const response = await fetchWithAuth(url)
  return response.data || response
}

// Sync State API
export const getSyncState = async (): Promise<SyncState[]> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/sync-state`)
  return response.data || response
}

// Visit Reports API (admin)
export interface VisitReportsQuery {
  keyword?: string
  start_date?: string
  end_date?: string
  sort_by?: 'latest' | 'oldest'
  page?: number
  page_size?: number
}

export const getVisitReports = async (query: VisitReportsQuery = {}): Promise<VisitReportListResponse> => {
  const params = new URLSearchParams()
  if (query.keyword) params.set('keyword', query.keyword)
  if (query.start_date) params.set('start_date', query.start_date)
  if (query.end_date) params.set('end_date', query.end_date)
  if (query.sort_by) params.set('sort_by', query.sort_by)
  if (query.page) params.set('page', String(query.page))
  if (query.page_size) params.set('page_size', String(query.page_size))
  const qs = params.toString()
  const url = `${API_BASE_URL}/api/admin/reports${qs ? `?${qs}` : ''}`
  const response = await fetchWithAuth(url)
  return response.data || response
}

export const getVisitReport = async (reportId: string): Promise<VisitReportDetail> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/reports/${reportId}`)
  return response.data || response
}

// Admin Visit Schedule API
export interface AdminVisitScheduleQuery {
  start_date?: string
  end_date?: string
  outlet_id?: string
  // Jalur kunjungan yang diminta. Server tetap memotongnya sesuai permission:
  // jadwal audit hanya untuk pemegang `audit.read`, jadi meminta 'audit' tanpa
  // hak akan mengembalikan hasil kosong, bukan error.
  source?: 'spv' | 'audit' | 'all'
}

export const getAdminVisitSchedule = async (query: AdminVisitScheduleQuery = {}): Promise<AdminVisitScheduleResponse> => {
  const params = new URLSearchParams()
  if (query.start_date) params.set('start_date', query.start_date)
  if (query.end_date) params.set('end_date', query.end_date)
  if (query.outlet_id) params.set('outlet_id', query.outlet_id)
  if (query.source) params.set('source', query.source)
  const qs = params.toString()
  const url = `${API_BASE_URL}/api/admin/visits${qs ? `?${qs}` : ''}`
  const response = await fetchWithAuth(url)
  return response.data || response
}

// Audit Reports API (admin)
export interface AuditReportsQuery {
  keyword?: string
  start_date?: string
  end_date?: string
  outlet_id?: string
  sort_by?: 'latest' | 'oldest'
  page?: number
  page_size?: number
}

export const getAuditReports = async (query: AuditReportsQuery = {}): Promise<AuditReportListResponse> => {
  const params = new URLSearchParams()
  if (query.keyword) params.set('keyword', query.keyword)
  if (query.start_date) params.set('start_date', query.start_date)
  if (query.end_date) params.set('end_date', query.end_date)
  if (query.outlet_id) params.set('outlet_id', query.outlet_id)
  if (query.sort_by) params.set('sort_by', query.sort_by)
  if (query.page) params.set('page', String(query.page))
  if (query.page_size) params.set('page_size', String(query.page_size))
  const qs = params.toString()
  const url = `${API_BASE_URL}/api/admin/audit/reports${qs ? `?${qs}` : ''}`
  const response = await fetchWithAuth(url)
  return response.data || response
}

export const getAuditReport = async (auditId: string): Promise<AuditReportDetailResponse> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/audit/reports/${auditId}`)
  return response.data || response
}

// Company Settings API
export const getCompanyMe = async (): Promise<Company> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/companies/me`)
  return response.data || response
}

export const updateCompanyMe = async (payload: { name?: string; defaultGallonPrice?: number }): Promise<Company> => {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/companies/me`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return response.data || response
}
