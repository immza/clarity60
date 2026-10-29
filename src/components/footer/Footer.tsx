import Link from 'next/link'

import { PrivacyChoicesLink } from '@/components/consent/ConsentBanner'
import { getLatestCorrection, getPublishedPageSlugs } from '@/lib/data'

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

export async function Footer() {
  const [correction, pageSlugs] = await Promise.all([getLatestCorrection(), getPublishedPageSlugs()])
  // Page links appear only once that page is published; /corrections is a built-in route.
  const links = LINKS.filter((l) => l.href === '/corrections' || pageSlugs.includes(l.href.slice(1)))

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
