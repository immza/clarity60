import Link from 'next/link'

import {
  getAllCategories,
  getLastUpdated,
  getSections,
  getSiteSettings,
  getStoriesTodayCount,
  getWireHeadlines,
} from '@/lib/data'
import type { SiteSetting } from '@/payload-types'
import { idOf } from '@/lib/relations'

import { EditionToggle } from './EditionToggle'
import { LastUpdated } from './LastUpdated'
import { NavLinks, type NavItem } from './NavLinks'
import { SideNav, type SideNavGroup } from './SideNav'
import './masthead.css'

const Wordmark = ({ as: Tag = 'span' }: { as?: 'h1' | 'span' }) => (
  <Tag className="wordmark">
    <span className="wordmark__clarity">Clarity</span>
    <span className="wordmark__60">60</span>
  </Tag>
)

type Ear = NonNullable<SiteSetting['leftEar']>

/** A masthead ear, configured in Site Settings. Live counts fall back to the text when zero. */
async function MastheadEar({ ear, side }: { ear: Ear | null | undefined; side: 'left' | 'right' }) {
  if (!ear?.enabled) return <div className={`masthead__ear masthead__ear--${side} masthead__ear--empty`} aria-hidden="true" />

  let text = ear.text ?? ''
  if (ear.kind === 'storiesToday') {
    const count = await getStoriesTodayCount()
    if (count > 0) text = `${count} new ${count === 1 ? 'story' : 'stories'} in the last 24 hours.`
  }
  const content = (
    <>
      {ear.label && <span className="label">{ear.label}</span>}
      {text && <span>{text}</span>}
    </>
  )
  const className = `masthead__ear masthead__ear--${side}`
  if (!ear.link) return <div className={className}>{content}</div>
  const external = /^https?:\/\//.test(ear.link)
  return external ? (
    <a className={className} href={ear.link} target="_blank" rel="noopener">
      {content}
    </a>
  ) : (
    <Link className={className} href={ear.link} prefetch={false}>
      {content}
    </Link>
  )
}

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
  const [settings, sections, categories, lastUpdated] = await Promise.all([
    getSiteSettings(),
    getSections(),
    getAllCategories(),
    getLastUpdated(),
  ])

  // Side drawer: every desk with its categories and sub-categories, straight from the CMS.
  const groups: SideNavGroup[] = sections.map((s) => {
    const tops = categories.filter((c) => idOf(c.section) === s.id && !c.parent)
    return {
      label: s.name,
      href: `/${s.slug}`,
      children: tops.map((c) => ({
        label: c.name,
        href: `/${s.slug}/${c.slug}`,
        children: categories
          .filter((sub) => idOf(sub.parent) === c.id)
          .map((sub) => ({ label: sub.name, href: `/${s.slug}/${c.slug}/${sub.slug}` })),
      })),
    }
  })
  const extras = (settings.navExtras ?? []).map((x) => ({ label: x.label, href: x.url }))

  const nav: NavItem[] = [
    { label: 'Front Page', href: '/' },
    ...sections.filter((s) => s.showInNav).map((s) => ({ label: s.name, href: `/${s.slug}` })),
    ...extras,
  ]

  return (
    <>
    <header className={`masthead masthead--${variant}`}>
      <div className="wrap">
        <div className="masthead__top">
          <div className="masthead__top-left">
            <SideNav groups={groups} extras={extras} />
          </div>
          <LastUpdated iso={lastUpdated} />
          {/* Right group: edition stamp now; sign-in and search slot in here later. */}
          <div className="masthead__top-right">
            <EditionToggle />
          </div>
        </div>

        {variant === 'front' ? (
          <div className="masthead__banner">
            <MastheadEar ear={settings.leftEar} side="left" />
            <Link href="/" className="masthead__home" aria-label="Clarity60, front page">
              <Wordmark as="h1" />
            </Link>
            <MastheadEar ear={settings.rightEar} side="right" />
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
        <hr className="rule-double" />
      </div>
    </header>
    {/* Outside <header> so it can stick to the top of the viewport for the whole page. */}
    <nav className="nav" aria-label="Sections">
      <div className="wrap">
        <NavLinks items={nav} />
        <hr className="rule" />
      </div>
    </nav>
    {variant === 'front' && (
      <div className="wrap">
        <Wire />
      </div>
    )}
    </>
  )
}
