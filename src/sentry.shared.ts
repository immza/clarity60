/**
 * Settings shared by the browser, server and edge Sentry setups. Nothing is sent
 * unless NEXT_PUBLIC_SENTRY_DSN is set, so local development stays quiet.
 *
 * dataCollection (which replaces sendDefaultPii in SDK v11) is locked down to match the
 * privacy policy: no user info, cookies, bodies, query strings, database values or local
 * variables leave the site. Only browser type and language headers are kept for debugging.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: { allow: ['user-agent', 'accept-language'] }, response: false },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    queues: false,
    stackFrameVariables: false,
  },
  // Performance sampling: 10% of requests in production is plenty at our scale.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
}
