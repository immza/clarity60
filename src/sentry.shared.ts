/**
 * Settings shared by the browser, server and edge Sentry setups. Nothing is sent
 * unless NEXT_PUBLIC_SENTRY_DSN is set, so local development stays quiet.
 * sendDefaultPii stays false: no IPs, cookies or request bodies leave the site.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV,
  sendDefaultPii: false,
  // Performance sampling: 10% of requests in production is plenty at our scale.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
}
