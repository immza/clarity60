'use client'

import { useSyncExternalStore } from 'react'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const absolute = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(d)

const relative = (d: Date) => {
  const diff = Date.now() - d.getTime()
  if (diff < 0) return absolute(d)
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))} min ago`
  if (diff < DAY) {
    const h = Math.round(diff / HOUR)
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`
  }
  if (diff < 2 * DAY) return 'Yesterday'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`
  return absolute(d)
}

const noopSubscribe = () => () => {}

/**
 * "2 hrs ago". Cached HTML carries the absolute date (correct for crawlers and old
 * caches); the browser upgrades it to a relative time.
 */
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const d = new Date(iso)
  const text = useSyncExternalStore(
    noopSubscribe,
    () => relative(d),
    () => absolute(d),
  )
  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  )
}
