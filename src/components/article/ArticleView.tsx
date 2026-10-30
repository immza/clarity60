import Link from 'next/link'

import { AdSlot } from '@/components/ads/AdSlot'
import { MediaImage } from '@/components/media/MediaImage'
import { RichText } from '@/components/RichText'
import { StoryCard } from '@/components/story/StoryCard'
import { getCorrectionsFor, getSiteSettings, listArticles } from '@/lib/data'
import { articleSchema, breadcrumbSchema, faqSchema, jsonLd } from '@/lib/schema'
import type { Article, Author, Category, Media, Section, Tag } from '@/payload-types'

import './article.css'

const obj = <T,>(v: T | number | null | undefined): T | null => (v && typeof v === 'object' ? v : null)

const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(iso))

const clock = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(iso))

function Byline({ article }: { article: Article }) {
  const authors = (article.authors ?? []).map((a) => obj<Author>(a)).filter((a): a is Author => Boolean(a))
  if (article.bylineOverride) return <span>{article.bylineOverride}</span>
  if (!authors.length) return <span>By the Clarity60 Desk</span>
  return (
    <span>
      By{' '}
      {authors.map((a, i) => (
        <span key={a.id}>
          {i > 0 && (i === authors.length - 1 ? ' and ' : ', ')}
          <Link href={`/author/${a.slug}`} rel="author" prefetch={false}>
            {a.name}
          </Link>
        </span>
      ))}
    </span>
  )
}

function Hero({ media }: { media: Media }) {
  const isVideo = media.mimeType?.startsWith('video/')
  return (
    <figure className="article__hero">
      {isVideo && media.url ? (
        <video
          controls
          preload="metadata"
          playsInline
          width={media.width ?? undefined}
          height={media.height ?? undefined}
          poster={media.poster && typeof media.poster === 'object' ? (media.poster.url ?? undefined) : undefined}
        >
          <source src={media.url} type={media.mimeType ?? undefined} />
        </video>
      ) : (
        <MediaImage media={media} sizes="(min-width: 1000px) 760px, 100vw" priority />
      )}
      {(media.caption || media.credit) && (
        <figcaption>
          {media.caption}
          {media.credit && <span className="article__credit"> Credit: {media.credit}</span>}
        </figcaption>
      )}
    </figure>
  )
}

export async function ArticleView({ article }: { article: Article }) {
  const section = obj<Section>(article.section)!
  const category = obj<Category>(article.category)!
  const parent = obj<Category>(category.parent)
  const hero = obj<Media>(article.heroMedia)
  const tags = (article.tags ?? []).map((t) => obj<Tag>(t)).filter((t): t is Tag => Boolean(t))
  const related = obj<Article>(article.relatedExplainer)
  const updates = article.developing?.isDeveloping ? (article.developing.updates ?? []) : []

  const crumbs = [
    { name: 'Front Page', path: '/' },
    { name: section.name, path: `/${section.slug}` },
    ...(parent ? [{ name: parent.name, path: `/${section.slug}/${parent.slug}` }] : []),
    {
      name: category.name,
      path: parent ? `/${section.slug}/${parent.slug}/${category.slug}` : `/${section.slug}/${category.slug}`,
    },
  ]

  const [corrections, more, settings] = await Promise.all([
    getCorrectionsFor(article.id),
    listArticles({ categoryIds: [category.id], excludeIds: [article.id], limit: 4 }),
    getSiteSettings(),
  ])
  const faq = faqSchema({ body: article.body, path: article.path ?? '/' }, settings)

  const sponsor = article.sponsorship?.isSponsored ? article.sponsorship : null
  const slotContext = { sectionId: section.id, categoryIds: [category.id, ...(parent ? [parent.id] : [])] }

  const published = article.publishedAt ?? article.createdAt
  const wasUpdated = new Date(article.updatedAt).getTime() - new Date(published).getTime() > 10 * 60_000

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articleSchema(article, settings))} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faq)} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(crumbs))} />

      <main id="main" className="wrap article-layout">
        <article className="article">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol>
              {crumbs.map((c) => (
                <li key={c.path}>
                  <Link href={c.path} prefetch={false}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>

          <header className="article__header">
            {sponsor && (
              <p className="article__sponsor">
                Sponsored
                {sponsor.sponsorName && (
                  <>
                    {' · Paid partnership with '}
                    {sponsor.sponsorUrl ? (
                      <a href={sponsor.sponsorUrl} rel="sponsored noopener" target="_blank">
                        {sponsor.sponsorName}
                      </a>
                    ) : (
                      sponsor.sponsorName
                    )}
                  </>
                )}
              </p>
            )}
            <p className="kicker">
              {updates.length > 0 && <span className="article__live">Developing · </span>}
              {category.name}
            </p>
            <h1 className="article__title">{article.title}</h1>
            <p className="article__dek">{article.summary}</p>
            <div className="article__byline">
              <Byline article={article} />
              <span className="article__dates">
                <time dateTime={published}>{longDate(published)}</time>
                {wasUpdated && (
                  <>
                    {' · Updated '}
                    <time dateTime={article.updatedAt}>{longDate(article.updatedAt)}</time>
                  </>
                )}
              </span>
              {article.readingMinutes ? <span className="article__length">{article.readingMinutes} min read</span> : null}
            </div>
            {article.hasAffiliateLinks && (
              <p className="article__disclosure">
                This article contains affiliate links. If you buy through them we may earn a commission, at no extra
                cost to you. It never affects what we recommend.
              </p>
            )}
          </header>

          {hero && <Hero media={hero} />}

          {updates.length > 0 && (
            <section className="developing" aria-labelledby="developing-title">
              <h2 id="developing-title" className="developing__title">
                <span className="developing__dot" aria-hidden="true" /> Developing · Latest updates
              </h2>
              <ol>
                {[...updates]
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .map((u) => (
                    <li key={u.id ?? u.at}>
                      <time dateTime={u.at}>{clock(u.at)}</time>
                      <p>{u.text}</p>
                    </li>
                  ))}
              </ol>
            </section>
          )}

          <RichText
            data={article.body}
            className="prose"
            sponsored={Boolean(sponsor)}
            // One ad inside the story, only in longer pieces, after the third paragraph.
            insert={{ after: 3, minBlocks: 7, node: <AdSlot slotKey="article-in-body" context={slotContext} /> }}
          />

          {article.sources && article.sources.length > 0 && (
            <section className="article__sources" aria-label="Sources">
              <strong>Sources: </strong>
              {article.sources.map((s, i) => (
                <span key={s.id ?? i}>
                  {i > 0 && '; '}
                  {s.url ? (
                    <a href={s.url} rel={sponsor ? 'sponsored noopener' : 'noopener nofollow'} target="_blank">
                      {s.outlet}
                    </a>
                  ) : (
                    s.outlet
                  )}
                </span>
              ))}
            </section>
          )}

          {article.instagramUrl && (
            <p className="article__ig">
              <a href={article.instagramUrl} rel={sponsor ? 'sponsored noopener' : 'noopener'} target="_blank">
                ▶ Watch the 60-second version on Instagram
              </a>
            </p>
          )}

          {related?.path && (
            <aside className="backstory">
              <p className="kicker">Need the backstory?</p>
              <Link href={related.path} prefetch={false}>
                {related.title} →
              </Link>
            </aside>
          )}

          <AdSlot slotKey="article-end" context={slotContext} />

          {corrections.length > 0 && (
            <section className="article__corrections" aria-labelledby="corrections-title">
              <h2 id="corrections-title">Corrections</h2>
              {corrections.map((c) => (
                <p key={c.id}>
                  <time dateTime={c.date}>{longDate(c.date)}</time>: {c.text}
                </p>
              ))}
            </section>
          )}

          {tags.length > 0 && (
            <ul className="article__tags" aria-label="Topics">
              {tags.map((t) => (
                <li key={t.id}>
                  <Link href={`/tag/${t.slug}`} prefetch={false}>
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <aside className="article-layout__side" aria-label="More stories">
          {more.docs.length > 0 && (
            <section>
              <h2 className="side-title">More in {category.name}</h2>
              {more.docs.map((a) => (
                <StoryCard key={a.id} article={a} variant="list" />
              ))}
            </section>
          )}
          <div className="article-layout__sticky">
            <AdSlot slotKey="article-sidebar" context={slotContext} />
          </div>
        </aside>
      </main>
    </>
  )
}
