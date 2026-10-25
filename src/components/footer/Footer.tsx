import Link from 'next/link'

import { getLatestCorrection } from '@/lib/data'

import './footer.css'

const LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Advertise', href: '/advertise' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookies', href: '/cookies' },
  { label: 'Terms', href: '/terms' },
]

export async function Footer() {
  const correction = await getLatestCorrection()

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
                )}
              </>
            ) : (
              'When we get something wrong, we say so here, plainly.'
            )}
          </p>
          <div className="footer__meta">
            <p>© {new Date().getFullYear()} Clarity60 · clarity60.com</p>
            <ul className="footer__links">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} prefetch={false}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
