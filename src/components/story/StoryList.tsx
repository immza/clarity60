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
  fullPageLinks = false,
}: {
  stories: CardArticle[]
  basePath: string
  page: number
  totalPages: number
  adKey?: string
  variant?: 'list' | 'grid'
  emptyText?: string
  /** Pager links do a full page load (search uses this so analytics sees a redacted URL). */
  fullPageLinks?: boolean
}) {
  const settings = await getSiteSettings()
  const every = Math.max(3, settings.inFeedAdEvery ?? 6)

  if (stories.length === 0) return <p className="story-list__empty">{emptyText}</p>

  const href = (p: number) => (p <= 1 ? basePath : `${basePath}${basePath.includes('?') ? '&' : '?'}page=${p}`)
  const PageLink = fullPageLinks ? 'a' : Link

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
            <PageLink href={href(page - 1)} rel="prev" {...(fullPageLinks ? {} : { prefetch: false })}>
              ← Newer
            </PageLink>
          )}
          <span>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <PageLink href={href(page + 1)} rel="next" {...(fullPageLinks ? {} : { prefetch: false })}>
              Older stories →
            </PageLink>
          )}
        </nav>
      )}
    </>
  )
}
