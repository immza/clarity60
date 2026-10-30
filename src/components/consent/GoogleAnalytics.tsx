'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

/**
 * Loads GA4 everywhere except search results, so readers' search words never reach
 * Google. Search pages are always full page loads (plain GET forms and links), so when
 * a reader moves on to a story, GA starts there with a clean URL and referrer.
 */
export function GoogleAnalytics({ id }: { id: string }) {
  if (usePathname() === '/search') return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`gtag('js', new Date()); gtag('config', ${JSON.stringify(id)}, { anonymize_ip: true });`}
      </Script>
    </>
  )
}
