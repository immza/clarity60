import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { AdSlot } from '@/components/ads/AdSlot'
import { Masthead } from '@/components/header/Masthead'
import { StoryCard } from '@/components/story/StoryCard'
import { StoryList } from '@/components/story/StoryList'
import { getPage, getSectionBySlug, getSectionCategories, getSections, listArticles } from '@/lib/data'
import { breadcrumbSchema, jsonLd } from '@/lib/schema'

import { StaticPage } from './StaticPage'
import './section.css'

type Props = { params: Promise<{ section: string }>; searchParams: Promise<{ page?: string }> }

const pageNumber = (raw?: string) => Math.max(1, Math.min(1000, Number.parseInt(raw ?? '1', 10) || 1))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = (await params).section
  const section = await getSectionBySlug(slug)
  if (!section) {
    const page = await getPage(slug)
    return page
      ? { title: page.meta?.title || page.title, description: page.meta?.description ?? undefined, alternates: { canonical: `/${page.slug}` } }
      : {}
  }
  const page = pageNumber((await searchParams).page)
  return {
    title: page > 1 ? `${section.name} · Page ${page}` : section.name,
    description: section.description ?? undefined,
    alternates: { canonical: page > 1 ? `/${section.slug}?page=${page}` : `/${section.slug}` },
  }
}

export default async function SectionPage({ params, searchParams }: Props) {
  const slug = (await params).section
  const section = await getSectionBySlug(slug)

  // Not a desk: it may be a static page (About, Privacy...).
  if (!section) {
    const staticPage = await getPage(slug)
    if (!staticPage) notFound()
    return <StaticPage page={staticPage} />
  }
  if (section.slug !== slug) permanentRedirect(`/${section.slug}`)

  const page = pageNumber((await searchParams).page)
  const isNews = section.kind === 'news'
  const [categories, sections] = await Promise.all([getSectionCategories(section.id), getSections()])

  const top = page === 1 ? (await listArticles({ sectionId: section.id, [isNews ? 'topStory' : 'featured']: true, limit: 1 })).docs[0] : undefined
  const result = await listArticles({ sectionId: section.id, excludeIds: top ? [top.id] : [], page, limit: 12 })
  if (page > 1 && result.docs.length === 0) notFound()

  const otherDesk = sections.find((s) => s.id !== section.id && s.kind !== section.kind)

  return (
    <>
      <Masthead variant="compact" />
      <main id="main" className="wrap section-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            breadcrumbSchema([
              { name: 'Front Page', path: '/' },
              { name: section.name, path: `/${section.slug}` },
            ]),
          )}
        />
        <p className="kicker">{section.kicker || 'Section'}</p>
        <h1 className="section-page__title">{section.name}</h1>
        {section.description && <p className="section-page__dek">{section.description}</p>}

        {isNews ? (
          <nav aria-label={`${section.name} categories`}>
            <ul className="section-tabs">
              <li>
                <Link href={`/${section.slug}`} aria-current="page" prefetch={false}>
                  All
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/${section.slug}/${c.slug}`} prefetch={false}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <nav aria-label={`${section.name} desks`}>
            <ul className="desk-grid">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/${section.slug}/${c.slug}`} prefetch={false}>
                    <strong>{c.name}</strong>
                    {c.description && <span>{c.description}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <hr className="rule-double" />

        <div className={isNews ? 'section-layout' : ''}>
          <div>
            {top && (
              <div className="section-page__top">
                <StoryCard article={top} variant={isNews ? 'lead' : 'feature'} headingLevel={2} priority />
              </div>
            )}
            <StoryList
              stories={result.docs}
              basePath={`/${section.slug}`}
              page={page}
              totalPages={result.totalPages}
              adKey="section-in-feed"
              variant={isNews ? 'list' : 'grid'}
              emptyText={`No ${section.name} stories yet. Check back soon.`}
            />
          </div>

          {isNews && (
            <aside className="section-layout__side" aria-label="Related">
              <AdSlot slotKey="section-sidebar" />
              {otherDesk && (
                <section className="backstory-box">
                  <h2 className="side-title">Need the backstory?</h2>
                  <p>Every big story links to an explainer that gives you the context.</p>
                  <Link href={`/${otherDesk.slug}`} prefetch={false}>
                    Browse all {otherDesk.name} →
                  </Link>
                </section>
              )}
            </aside>
          )}
        </div>
      </main>
    </>
  )
}
