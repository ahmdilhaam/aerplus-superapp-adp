// Date helpers for the visit schedule views. All UTC based so they line up with
// the plain ISO date strings the API returns (no timezone drift).

export const MS_PER_DAY = 24 * 60 * 60 * 1000

export const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export const toISODate = (d: Date): string => d.toISOString().slice(0, 10)

export const addDays = (iso: string, n: number): string => {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return toISODate(d)
}

// Monday of the week containing `iso`
export const startOfWeek = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00Z')
  const dow = d.getUTCDay() // 0 = Sunday
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? -6 : 1 - dow))
  return toISODate(d)
}

export const shortMonth = (iso: string): string =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { month: 'short', timeZone: 'UTC' })

export const dayNum = (iso: string): number => new Date(iso + 'T00:00:00Z').getUTCDate()

export const formatWeekRange = (start: string, end: string): string => {
  const year = new Date(end + 'T00:00:00Z').getUTCFullYear()
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${dayNum(start)} – ${dayNum(end)} ${shortMonth(end)} ${year}`
  }
  return `${dayNum(start)} ${shortMonth(start)} – ${dayNum(end)} ${shortMonth(end)} ${year}`
}

export const formatDateId = (d: string): string =>
  new Date(d + 'T00:00:00Z').toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

// Full timestamps (presensi check-in/checkout) carry a real time-of-day, so
// unlike the date-only helpers above these render in the viewer's local zone.
export const formatDateTimeId = (iso: string | null): string =>
  iso
    ? new Date(iso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'
