'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/** Last-resort error screen (the root layout itself failed). Reports to Sentry. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Georgia, serif', background: '#f2ede3', color: '#161512' }}>
        <main style={{ maxWidth: 560, margin: '15vh auto', padding: '0 16px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Arial Narrow, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13 }}>
            Clarity60 · Stop the presses
          </p>
          <h1 style={{ fontSize: 34, margin: '8px 0 12px' }}>Something went wrong on our end.</h1>
          <p>Please try again in a moment. If it keeps happening, email hello@clarity60.com.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, padding: '10px 18px', border: '1.5px solid #161512', background: 'transparent', cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
