import Link from 'next/link'

import { MediaImage } from '@/components/media/MediaImage'
import type { CardArticle } from '@/lib/data'

import { RelativeTime } from './RelativeTime'
import './story.css'

type Variant = 'list' | 'grid' | 'feature' | 'lead'

const categoryName = (a: CardArticle) => (a.category && typeof a.category === 'object' ? a.category.name : null)

export function StoryMeta({ article }: { article: CardArticle }) {
  return (
    <p className="story__meta">
      {article.publishedAt && <RelativeTime iso={article.publishedAt} />}
      {article.publishedAt && article.columnInches ? ' · ' : null}
      {article.columnInches ? (
        <span>
          {article.columnInches} column {article.columnInches === 1 ? 'inch' : 'inches'}
        </span>
      ) : null}
    </p>
  )
}

/**
 * One story in any listing. `list`: thumbnail left (World News / Latest feed);
 * `grid`: image on top (Explainers grid); `feature`/`lead`: big image and headline.
 */
export function StoryCard({
  article,
  variant = 'list',
  headingLevel = 3,
  priority,
}: {
  article: CardArticle
  variant?: Variant
  headingLevel?: 2 | 3
  priority?: boolean
}) {
  const H = `h${headingLevel}` as 'h2' | 'h3'
  const cat = categoryName(article)
  const href = article.path ?? '#'
  const sizes =
    variant === 'list'
      ? '(min-width: 720px) 180px, 120px'
      : variant === 'grid'
        ? '(min-width: 1000px) 280px, (min-width: 600px) 45vw, 100vw'
        : '(min-width: 1000px) 640px, 100vw'

  return (
    <article className={`story story--${variant}`}>
      <Link href={href} className="story__media" tabIndex={-1} aria-hidden="true" prefetch={false}>
        <MediaImage media={article.heroMedia} sizes={sizes} priority={priority} />
        {cat && variant !== 'lead' && <span className="story__badge">{cat}</span>}
        {article.instagramUrl && <span className="story__ig">▶ Watch on IG</span>}
      </Link>
      <div className="story__text">
        {cat && <p className="kicker">{article.featured && variant === 'feature' ? `Featured · ${cat}` : cat}</p>}
        <H className="story__title">
          <Link href={href} prefetch={false}>
            {article.title}
          </Link>
        </H>
        {article.summary && <p className="story__summary">{article.summary}</p>}
        <StoryMeta article={article} />
      </div>
    </article>
  )
}
