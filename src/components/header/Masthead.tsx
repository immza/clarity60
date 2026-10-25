import Link from 'next/link'

import { getSections, getSiteSettings, getWireHeadlines } from '@/lib/data'

import { Dateline } from './Dateline'
import { EditionToggle } from './EditionToggle'
import { NavLinks, type NavItem } from './NavLinks'
import './masthead.css'

const Wordmark = ({ as: Tag = 'span' }: { as?: 'h1' | 'span' }) => (
  <Tag className="wordmark">
    <span className="wordmark__clarity">Clarity</span>
    <span className="wordmark__60">60</span>
  </Tag>
)

async function Wire() {
  const items = await getWireHeadlines()
  return (
    <div className="wire" role="region" aria-label="The Wire: latest headlines">
      <span className="wire__label">The Wire</span>
      <div className="wire__viewport">
        {items.length === 0 ? (
          <p className="wire__empty">Headlines from every region appear here as stories are published.</p>
        ) : (
          // The list is rendered twice so the scroll loops seamlessly; the copy is hidden from screen readers.
          <div className="wire__track">
            {[0, 1].map((copy) => (
              <ul key={copy} className="wire__list" aria-hidden={copy === 1 || undefined}>
                {items.map((item) => (
                  <li key={item.path}>
                    <Link href={item.path} tabIndex={copy === 1 ? -1 : undefined} prefetch={false}>
                      <span className="wire__region">{item.label}.</span> {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * The front page gets the full broadsheet masthead; every other page gets the compact
 * one. Navigation comes from Sections ("Show in nav") plus Site Settings extras.
 */
export async function Masthead({ variant }: { variant: 'front' | 'compact' }) {
  const [settings, sections] = await Promise.all([getSiteSettings(), getSections()])

  const nav: NavItem[] = [
    { label: 'Front Page', href: '/' },
    ...sections.filter((s) => s.showInNav).map((s) => ({ label: s.name, href: `/${s.slug}` })),
    ...(settings.navExtras ?? []).map((x) => ({ label: x.label, href: x.url })),
  ]

  return (
    <header className={`masthead masthead--${variant}`}>
      <div className="wrap">
        <div className="masthead__top">
          <Dateline launchDate={settings.launchDate} />
          <EditionToggle />
        </div>

        {variant === 'front' ? (
          <div className="masthead__banner">
            <div className="masthead__ear masthead__ear--left" aria-hidden="true">
              <span className="label">Late City</span>
              <span>Every story, explained in plain English.</span>
            </div>
            <Link href="/" className="masthead__home" aria-label="Clarity60, front page">
              <Wordmark as="h1" />
            </Link>
            <div className="masthead__ear masthead__ear--right" aria-hidden="true">
              <span className="label">Price</span>
              <span>Free. Always.</span>
            </div>
            <p className="masthead__tagline">{settings.tagline}</p>
          </div>
        ) : (
          <div className="masthead__compact">
            <Link href="/" className="masthead__home" aria-label="Clarity60, front page">
              <Wordmark />
            </Link>
            <p className="masthead__tagline">{settings.tagline}</p>
          </div>
        )}
      </div>

      <nav className="nav" aria-label="Sections">
        <div className="wrap">
          <hr className="rule-double" />
          <NavLinks items={nav} />
          {variant === 'front' ? <Wire /> : <hr className="rule" />}
        </div>
      </nav>
    </header>
  )
}
