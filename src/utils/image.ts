import { API_BASE_URL } from '../services/api'

const IMAGE_BASE = (import.meta.env.VITE_IMAGE_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? ''

/**
 * Normalize a raw image URL. Returns undefined for empty.
 * Absolute/data/blob URLs pass through. Relative paths get prefixed with
 * VITE_IMAGE_BASE_URL when configured, else returned as-is.
 */
export const resolveImageUrl = (raw?: string | null): string | undefined => {
  if (!raw) return undefined
  const s = raw.trim()
  if (!s) return undefined
  if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s
  if (!IMAGE_BASE) return s
  return `${IMAGE_BASE}/${s.replace(/^\/+/, '')}`
}

/**
 * Normalize a file URL served by the API itself (e.g. audit photo evidence).
 * Absolute/data/blob URLs (s3 presigned, etc.) pass through as-is. Relative
 * paths (local storage driver, e.g. "/uploads/superapp/audit/...") are
 * resolved against the API base URL. Returns undefined for empty/null.
 */
export const resolveApiFileUrl = (raw?: string | null): string | undefined => {
  if (!raw) return undefined
  const s = raw.trim()
  if (!s) return undefined
  if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s
  return `${API_BASE_URL}/${s.replace(/^\/+/, '')}`
}
