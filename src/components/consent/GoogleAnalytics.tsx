'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

// Search is only ever reached by a full page load (plain GET forms and links), so a page
// that started on /search is the only one in which the browser's history can hold a
// search URL. GA stays off for that page's whole life, including Back to the results.
const startedOnSearch = typeof window !== 'undefined' && window.location.pathname === '/search'

/**
 * Loads GA4 everywhere except search results, so readers' search words never reach
 * Google. A visit that begins on a story never has a search URL in the same page.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  if (usePathname() === '/search' || startedOnSearch) return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`gtag('js', new Date()); gtag('config', ${JSON.stringify(id)}, { anonymize_ip: true });`}
      </Script>
    </>
  )
}
