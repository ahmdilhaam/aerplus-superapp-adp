// Helpers for rendering presensi (check-in/checkout) & duration info on visit
// reports and admin visit schedules (F01 Fase 5). Return shape follows the
// shared `Badge` component's `variant` prop (see src/components/Badge.tsx)
// rather than raw Tailwind classes or hex, to stay consistent with how
// VisitSchedules.tsx already renders status badges.
export type DurationBadgeVariant = 'success' | 'warning' | 'error' | 'info'

export interface DurationBadgeInfo {
  label: string
  variant: DurationBadgeVariant
}

// "45m" for < 1 hour, "1j 20m" for >= 1 hour (no trailing "0m").
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours}j ${rest}m` : `${hours}j`
}

export function durationBadge(minutes: number | null | undefined): DurationBadgeInfo | null {
  if (minutes === null || minutes === undefined) return null
  const text = formatDuration(minutes)
  if (minutes < 15) return { label: `${text} · Terlalu Singkat`, variant: 'error' }
  if (minutes < 60) return { label: `${text} · Singkat`, variant: 'warning' }
  if (minutes <= 120) return { label: `${text} · Ideal`, variant: 'success' }
  return { label: `${text} · Lama`, variant: 'info' }
}
