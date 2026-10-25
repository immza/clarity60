'use client'

import { useSyncExternalStore } from 'react'

const MIN = 60_000
const HOUR = 60 * MIN

const absolute = (d: Date, timeZone?: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(d)

const forReader = (d: Date) => {
  const diff = Date.now() - d.getTime()
  if (diff >= 0 && diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))} min ago`
  if (diff >= 0 && diff < 12 * HOUR) {
    const h = Math.round(diff / HOUR)
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`
  }
  return absolute(d)
}

const noopSubscribe = () => () => {}

/**
 * "Last updated 12 min ago": when the newest story was published or edited. Cached
 * HTML carries the time in GMT; the browser shows it relative, in the reader's zone.
 */
export function LastUpdated({ iso }: { iso: string | null }) {
  const text = useSyncExternalStore(
    noopSubscribe,
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
