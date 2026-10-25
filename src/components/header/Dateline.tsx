'use client'

import { useSyncExternalStore } from 'react'

const DAY = 86_400_000

const format = (launchDate: string, timeZone?: string) => {
  const now = new Date()
  const launch = new Date(launchDate)
  const issue = Math.max(1, Math.floor((now.getTime() - launch.getTime()) / DAY) + 1)
  const volume = Math.max(1, now.getUTCFullYear() - launch.getUTCFullYear() + 1)
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(now)
  return `Vol. ${volume} · No. ${issue}|${date}`
}

const noopSubscribe = () => () => {}

/**
 * "Vol. 1 · No. 47" and today's date. Pages are cached, so the server renders the
 * date in GMT and the browser shows the reader's own date after hydration.
 */
export function Dateline({ launchDate }: { launchDate: string }) {
  const text = useSyncExternalStore(
    noopSubscribe,
    () => format(launchDate),
    () => format(launchDate, 'UTC'),
  )
  const [issue, date] = text.split('|')

  return (
    <>
      <span className="dateline__issue">{issue}</span>
      <time className="dateline__date">{date}</time>
    </>
  )
}
