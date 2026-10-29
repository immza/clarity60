/**
 * Security headers for every response.
 *
 * The CSP allow-lists where scripts, images and connections may come from. It does
 * not use per-request nonces: those force dynamic rendering, which would switch off the
 * page caching that keeps the site fast. Inline scripts are therefore allowed, but
 * only our own origin and the named Google hosts can supply scripts.
 *
 * When AdSense is switched on, add its hosts to ADS below (see docs/SPEC.md §7b).
 */
const isDev = process.env.NODE_ENV !== 'production'

const GOOGLE_ANALYTICS = [
  'https://www.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
]
const ADS: string[] = []
const IMAGES = ['https://ik.imagekit.io']

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${[...GOOGLE_ANALYTICS, ...ADS].join(' ')}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${[...IMAGES, ...GOOGLE_ANALYTICS, ...ADS].join(' ')}`,
  `font-src 'self' data:`,
  `media-src 'self' blob: ${IMAGES.join(' ')}`,
  `connect-src 'self' ${[...GOOGLE_ANALYTICS, ...ADS].join(' ')}${isDev ? ' ws:' : ''}`,
  `frame-src 'self' ${ADS.join(' ')}`.trim(),
  `worker-src 'self' blob:`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

export const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // One year of HTTPS-only; add "preload" once the site has run on HTTPS for a while.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
]
