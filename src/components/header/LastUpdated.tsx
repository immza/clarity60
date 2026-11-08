'use client'

import { useSyncExternalStore } from 'react'

const MIN = 60_000
const HOUR = 60 * MIN

/**
 * "8 Nov, 14:05 UTC". Assembled from parts because browsers join them differently (Safari
 * writes "8 Nov at 14:05"), and a server/browser mismatch makes React rebuild the page.
 */
export const absolute = (d: Date, timeZone?: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')} ${get('month')}, ${get('hour')}:${get('minute')} ${get('timeZoneName')}`
}

const forReader = (d: Date) => {
  const diff = Date.now() - d.getTime()
  if (diff >= 0 && diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))} min ago`
  if (diff >= 0 && diff < 12 * HOUR) {
    const h = Math.round(diff / HOUR)
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`
  }
  return absolute(d)
}

// Re-read the clock every minute so "12 min ago" stays true while the page is open.
const everyMinute = (onChange: () => void) => {
  const id = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(id)
}

/**
 * "Last updated 12 min ago": when the newest story was published or edited. Cached
 * HTML carries the time in GMT; the browser shows it relative, in the reader's zone.
 */
export function LastUpdated({ iso }: { iso: string | null }) {
  const text = useSyncExternalStore(
    everyMinute,
    () => (iso ? forReader(new Date(iso)) : ''),
    () => (iso ? absolute(new Date(iso), 'UTC') : ''),
  )
  if (!iso) return <span className="last-updated" />
  return (
    <span className="last-updated">
      <span className="last-updated__dot" aria-hidden="true" />
      Last updated <time dateTime={iso}>{text}</time>
    </span>
  )
}
