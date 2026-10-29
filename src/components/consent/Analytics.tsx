import Script from 'next/script'

import { ConsentBanner } from './ConsentBanner'

/**
 * GA4 behind Consent Mode v2. Nothing loads (and no banner shows) until
 * NEXT_PUBLIC_GA_ID is set. The consent defaults run in <head> (see layout).
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID
  if (!id) return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
      {/* Search pages report as plain /search, so readers' search words never reach Google. */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`gtag('js', new Date()); gtag('config', ${JSON.stringify(id)}, Object.assign({ anonymize_ip: true }, location.pathname === '/search' ? { page_location: location.origin + '/search', page_title: 'Search' } : {}));`}
      </Script>
      <ConsentBanner />
    </>
  )
}
