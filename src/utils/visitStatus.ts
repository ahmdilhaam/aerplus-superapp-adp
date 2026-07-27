export type VisitStatusVariant = 'success' | 'warning' | 'error' | 'info'

export const getStatusVariant = (statusCode: string): VisitStatusVariant => {
  const map: Record<string, VisitStatusVariant> = {
    completed: 'success',
    scheduled: 'warning',
    missed: 'error',
    failed: 'error',
    approved: 'success',
    pending: 'warning',
    rejected: 'error',
    libur: 'info',
  }
  return map[statusCode] ?? 'warning'
}
