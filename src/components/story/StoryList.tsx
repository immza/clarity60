import Link from 'next/link'
import { Fragment } from 'react'

import { AdSlot } from '@/components/ads/AdSlot'
import { getSiteSettings, type CardArticle } from '@/lib/data'

import { StoryCard } from './StoryCard'

/**
 * A paginated run of stories with an in-feed ad every N (Site Settings). Pagination
 * uses real ?page= links so crawlers can reach every story.
 */
export async function StoryList({
  stories,
  basePath,
  page,
  totalPages,
  adKey,
  variant = 'list',
  emptyText = 'No stories here yet.',
}: {
  stories: CardArticle[]
  basePath: string
  page: number
  totalPages: number
  adKey?: string
  variant?: 'list' | 'grid'
  emptyText?: string
}) {
  const settings = await getSiteSettings()
  const every = Math.max(3, settings.inFeedAdEvery ?? 6)

  if (stories.length === 0) return <p className="story-list__empty">{emptyText}</p>

  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`)

  return (
    <>
      <div className={`story-list story-list--${variant}`}>
        {stories.map((s, i) => (
          <Fragment key={s.id}>
            <StoryCard article={s} variant={variant} priority={i === 0} />
            {adKey && variant === 'list' && (i + 1) % every === 0 && i < stories.length - 1 && (
              <AdSlot slotKey={adKey} />
            )}
          </Fragment>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="pager" aria-label="Pages">
          {page > 1 && (
            <Link href={href(page - 1)} rel="prev" prefetch={false}>
              ← Newer
            </Link>
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={href(page + 1)} rel="next" prefetch={false}>
              Older stories →
            </Link>
          )}
        </nav>
      )}
    </>
  )
}
