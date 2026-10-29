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

// Global Privacy Control (a browser opt-out signal US state laws require us to honour):
// ad personalisation and data "sharing" stay off, whatever else the reader chooses.
const GPC_OVERRIDE = { ad_user_data: 'denied', ad_personalization: 'denied' }

/**
 * Runs in <head> before Google tags: Consent Mode v2 defaults (denied in strict regions,
 * granted elsewhere), re-applies a choice the reader already made, then applies GPC.
 */
export const consentDefaultsScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',${JSON.stringify({ ...DENIED, wait_for_update: 500, region: STRICT_REGIONS })});
gtag('consent','default',${JSON.stringify(GRANTED)});
try{var c=localStorage.getItem('${CONSENT_KEY}');if(c==='granted')gtag('consent','update',${JSON.stringify(GRANTED)});if(c==='denied')gtag('consent','update',${JSON.stringify(DENIED)})}catch(e){}
if(navigator.globalPrivacyControl===true)gtag('consent','update',${JSON.stringify(GPC_OVERRIDE)});`

/** Consent update for a reader's choice; GPC always wins for ad personalisation. */
export const consentUpdate = (granted: boolean, gpc = false) =>
  granted ? { ...GRANTED, ...(gpc ? GPC_OVERRIDE : {}) } : DENIED
