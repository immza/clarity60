import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Playfair_Display, Source_Serif_4 } from 'next/font/google'
import React from 'react'

import { Analytics } from '@/components/consent/Analytics'
import { consentDefaultsScript } from '@/components/consent/consent'
import { Footer } from '@/components/footer/Footer'
import { themeInitScript } from '@/components/header/EditionToggle'
import './styles.css'

const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-bebas', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' })
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Clarity60 · The world, explained.', template: '%s · Clarity60' },
  description: 'World news and explainers in plain English. The world, explained.',
  applicationName: 'Clarity60',
  // Lets Google show large image previews (e.g. in Discover) and full snippets; without
  // max-image-preview:large, Discover only shows a small thumbnail.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2ede3' },
    { media: '(prefers-color-scheme: dark)', color: '#14130f' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${playfair.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets Morning/Night Edition before first paint so the page never flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Consent Mode v2 defaults must run before any Google tag. */}
        {process.env.NEXT_PUBLIC_GA_ID && <script dangerouslySetInnerHTML={{ __html: consentDefaultsScript }} />}
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
