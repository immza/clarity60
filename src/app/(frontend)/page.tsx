import Link from 'next/link'

import { AdSlot } from '@/components/ads/AdSlot'
import { Masthead } from '@/components/header/Masthead'
import { MediaImage } from '@/components/media/MediaImage'
import { StoryCard } from '@/components/story/StoryCard'
import { StoryList } from '@/components/story/StoryList'
import { getSections, listArticles, type CardArticle } from '@/lib/data'
import { jsonLd, organization, websiteSchema } from '@/lib/schema'

import './front.css'

const catName = (a: CardArticle) => (a.category && typeof a.category === 'object' ? a.category.name : '')

export default async function FrontPage() {
  const sections = await getSections()
  const newsSection = sections.find((s) => s.kind === 'news')
  const evergreenSection = sections.find((s) => s.kind === 'evergreen')

  // The lead is the newest "featured" story, else the newest evergreen one.
  const [featured, topStories] = await Promise.all([
    listArticles({ featured: true, limit: 1 }),
    listArticles({ topStory: true, limit: 2 }),
  ])
  const lead =
    featured.docs[0] ??
    (evergreenSection ? (await listArticles({ sectionId: evergreenSection.id, limit: 1 })).docs[0] : undefined)
  const top = topStories.docs.find((d) => d.id !== lead?.id)
  const used = [lead?.id, top?.id].filter((id): id is number => Boolean(id))

  const [latestBrief, feed, explainers] = await Promise.all([
    newsSection ? listArticles({ sectionId: newsSection.id, excludeIds: used, limit: 5 }) : null,
    listArticles({ excludeIds: used, limit: 12 }),
    evergreenSection ? listArticles({ sectionId: evergreenSection.id, excludeIds: used, limit: 5 }) : null,
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(websiteSchema())} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({ '@context': 'https://schema.org', ...organization() })}
      />
      <Masthead variant="front" />
      <main id="main" className="wrap front">
        <div className="front__top">
          <section className="front__brief" aria-labelledby="brief-title">
            <p className="kicker">News in brief</p>
            <h2 id="brief-title" className="front__col-title">
              The Latest
            </h2>
            <ol className="brief">
              {(latestBrief?.docs ?? []).map((a, i) => (
                <li key={a.id}>
                  <span className="brief__n">{i + 1}</span>
                  <p>
                    <span className="brief__region">{catName(a)}.</span>{' '}
                    <Link href={a.path ?? '#'} prefetch={false}>
                      {a.title}
                    </Link>
                  </p>
                </li>
              ))}
            </ol>
            {newsSection && (
              <p className="front__more">
                <Link href={`/${newsSection.slug}`} prefetch={false}>
                  All {newsSection.name} →
                </Link>
              </p>
            )}
          </section>

          {lead && (
            <section className="front__lead" aria-labelledby="lead-title">
              <p className="kicker">
                The Long Read{lead.columnInches ? ` · ${lead.columnInches} column inches` : ''}
              </p>
              <h2 id="lead-title" className="front__lead-title">
                <Link href={lead.path ?? '#'} prefetch={false}>
                  {lead.title}
                </Link>
              </h2>
              <p className="front__dek">{lead.summary}</p>
              <Link href={lead.path ?? '#'} tabIndex={-1} aria-hidden="true" prefetch={false}>
                <MediaImage
                  media={lead.heroMedia}
                  sizes="(min-width: 1000px) 520px, 100vw"
                  priority
                  fallbackLabel="Illustration"
                />
              </Link>
              <p className="front__continue">
                <Link href={lead.path ?? '#'} prefetch={false}>
                  Continue reading →
                </Link>
              </p>
            </section>
          )}

          <div className="front__right">
            {top && (
              <section aria-labelledby="top-title" className="front__topstory">
                <p className="kicker" id="top-title">
                  Top story
                </p>
                <StoryCard article={top} variant="grid" />
              </section>
            )}
            <AdSlot slotKey="home-sidebar" />
          </div>
        </div>

        <div className="front__feed">
          <section aria-labelledby="latest-title">
            <div className="front__feed-head">
              <h2 id="latest-title" className="front__section-title">
                Latest
              </h2>
              <ul className="front__tabs">
                {sections
                  .filter((s) => s.showInNav)
                  .map((s) => (
                    <li key={s.id}>
                      <Link href={`/${s.slug}`} prefetch={false}>
                        {s.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
            <StoryList
              stories={feed.docs}
              basePath="/latest"
              page={1}
              totalPages={1}
              adKey="home-in-feed"
              emptyText="The first edition is being written. Check back soon."
            />
            {feed.totalPages > 1 && (
              <p className="front__more-stories">
                <Link href="/latest" prefetch={false}>
                  More stories →
                </Link>
              </p>
            )}
          </section>

          <aside className="front__side" aria-label={`From ${evergreenSection?.name ?? 'the explainers desk'}`}>
            {explainers && explainers.docs.length > 0 && (
              <section>
                <h2 className="side-title">{evergreenSection?.name}</h2>
                <ol className="ranked">
                  {explainers.docs.map((a, i) => (
                    <li key={a.id}>
                      <span className="ranked__n">{i + 1}</span>
                      <Link href={a.path ?? '#'} prefetch={false}>
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <AdSlot slotKey="section-sidebar" />
          </aside>
        </div>
      </main>
    </>
  )
}
