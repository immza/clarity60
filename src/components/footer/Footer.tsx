import Link from 'next/link'

import { PrivacyChoicesLink } from '@/components/consent/ConsentBanner'
import { getLatestCorrection, getPublishedPageSlugs, getSiteSettings } from '@/lib/data'

import './footer.css'

const LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Editorial Standards', href: '/editorial-standards' },
  { label: 'Corrections', href: '/corrections' },
  { label: 'Advertise', href: '/advertise' },
  { label: 'Ad & Affiliate Disclosure', href: '/advertising-disclosure' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookies', href: '/cookies' },
  { label: 'Terms', href: '/terms' },
]

const SOCIALS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'x', label: 'X' },
] as const

export async function Footer() {
  const pageLinks = LINKS.filter((l) => l.href !== '/corrections').map((l) => l.href.slice(1))
  const [correction, pageSlugs, settings] = await Promise.all([
    getLatestCorrection(),
    getPublishedPageSlugs(pageLinks),
    getSiteSettings(),
  ])
  // Page links appear only once that page is published; /corrections is a built-in route.
  const links = LINKS.filter((l) => l.href === '/corrections' || pageSlugs.includes(l.href.slice(1)))
  // Official accounts from Site Settings → Socials; empty ones are skipped.
  const socials = SOCIALS.map((s) => ({ ...s, url: settings.socials?.[s.key] })).filter((s) => s.url)

  return (
    <footer className="footer">
      <div className="wrap">
        <hr className="rule" />
        <div className="footer__row">
          <p className="footer__correction">
            <strong>Corrections.</strong>{' '}
            {correction ? (
              <>
                {correction.text}{' '}
                {correction.path && (
                  <Link href={correction.path} prefetch={false}>
                    Read the story
                  </Link>
                )}{' '}
                <Link href="/corrections" prefetch={false}>
                  All corrections
                </Link>
              </>
            ) : (
              'When we get something wrong, we say so here, plainly.'
            )}
          </p>
          <div className="footer__meta">
            <p>© {new Date().getFullYear()} Clarity60 · clarity60.com</p>
            {socials.length > 0 && (
              <p className="footer__follow">
                Follow Clarity60:{' '}
                {socials.map((s, i) => (
                  <span key={s.key}>
                    {i > 0 && ' · '}
                    <a href={s.url!} target="_blank" rel="me noopener">
                      {s.label}
                    </a>
                  </span>
                ))}
              </p>
            )}
            <ul className="footer__links">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} prefetch={false}>
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <PrivacyChoicesLink hasConsentBanner={Boolean(process.env.NEXT_PUBLIC_GA_ID)} />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
