import { ConsentBanner } from './ConsentBanner'
import { GoogleAnalytics } from './GoogleAnalytics'

/**
 * GA4 behind Consent Mode v2. Nothing loads (and no banner shows) until
 * NEXT_PUBLIC_GA_ID is set. The consent defaults run in <head> (see layout).
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID
  if (!id) return null
  return (
    <>
      <GoogleAnalytics id={id} />
      <ConsentBanner />
    </>
  )
}
