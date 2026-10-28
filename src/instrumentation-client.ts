import * as Sentry from '@sentry/nextjs'

import { sentryOptions } from './sentry.shared'

Sentry.init({
  ...sentryOptions,
  // Browser noise that is not our bug (extensions, flaky networks).
  ignoreErrors: ['ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications', 'Load failed', 'NetworkError when attempting to fetch resource.'],
  denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
