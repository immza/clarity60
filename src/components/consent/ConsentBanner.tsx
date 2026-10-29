'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { CONSENT_EVENT, CONSENT_KEY, consentUpdate } from './consent'
import './consent.css'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const readChoice = () => {
  try {
    return localStorage.getItem(CONSENT_KEY)
  } catch {
    return null
  }
}

/** A slim bar at the bottom, shown until the reader chooses. Reopened from the footer. */
export function ConsentBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Defer so the banner never competes with the page's first paint.
    const t = window.setTimeout(() => setOpen(readChoice() === null), 0)
    const reopen = () => setOpen(true)
    window.addEventListener(CONSENT_EVENT, reopen)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener(CONSENT_EVENT, reopen)
    }
  }, [])

  const choose = (granted: boolean) => {
    try {
      localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied')
    } catch {
      // Blocked storage: the choice still applies for this visit.
    }
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
    window.gtag?.('consent', 'update', consentUpdate(granted, gpc))
    setOpen(false)
  }

  if (!open) return null
  return (
    <section className="consent" role="region" aria-label="Cookie choices">
      <p>
        We use cookies to count readers and, later, to show ads. Essential cookies are always on.{' '}
        <Link href="/cookies" prefetch={false}>
          Cookie policy
        </Link>
      </p>
      <div className="consent__actions">
        <button type="button" onClick={() => choose(false)}>
          Essential only
        </button>
        <button type="button" className="consent__accept" onClick={() => choose(true)}>
          Accept all
        </button>
      </div>
    </section>
  )
}

/**
 * "Privacy choices" footer link on every page. With analytics/ads configured it reopens the
 * consent banner; without them there is nothing to choose, so it links to the Cookie Policy.
 */
export function PrivacyChoicesLink({ hasConsentBanner }: { hasConsentBanner: boolean }) {
  if (!hasConsentBanner) {
    return (
      <Link href="/cookies" prefetch={false}>
        Privacy choices
      </Link>
    )
  }
  return (
    <button type="button" className="footer__linkbtn" onClick={() => window.dispatchEvent(new Event(CONSENT_EVENT))}>
      Privacy choices
    </button>
  )
}
