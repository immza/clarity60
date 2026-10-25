/** Shared consent constants for the banner, the head script and the footer link. */
export const CONSENT_KEY = 'c60-consent'
export const CONSENT_EVENT = 'c60:open-consent'

// EEA + UK + Switzerland: tracking is denied until the reader opts in.
export const STRICT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI',
  'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH',
]

const DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' }
const GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' }

/**
 * Runs in <head> before Google tags: Consent Mode v2 defaults (denied in strict regions,
 * granted elsewhere), then re-applies a choice the reader already made.
 */
export const consentDefaultsScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',${JSON.stringify({ ...DENIED, wait_for_update: 500, region: STRICT_REGIONS })});
gtag('consent','default',${JSON.stringify(GRANTED)});
try{var c=localStorage.getItem('${CONSENT_KEY}');if(c==='granted')gtag('consent','update',${JSON.stringify(GRANTED)});if(c==='denied')gtag('consent','update',${JSON.stringify(DENIED)})}catch(e){}`

export const consentUpdate = (granted: boolean) => (granted ? GRANTED : DENIED)
