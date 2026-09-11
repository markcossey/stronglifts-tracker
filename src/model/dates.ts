const DEFAULT_DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

export function formatDate(isoDate: string, options: Intl.DateTimeFormatOptions = DEFAULT_DATE_FORMAT): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString(undefined, options)
}

export function localDateString(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
