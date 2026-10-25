import { getRecentArticles } from '@/lib/feeds'
import { getSectionBySlug } from '@/lib/data'
import { renderRss, rssResponse } from '@/lib/rss'

/** /rss/{section}.xml: one feed per desk (new desks get a feed automatically). */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const slug = /^([a-z0-9-]+)\.xml$/.exec((await params).name)?.[1]
  const section = slug ? await getSectionBySlug(slug) : null
  if (!section || section.slug !== slug) return new Response('Not found', { status: 404 })

  const items = await getRecentArticles({ sectionId: section.id, limit: 50 })
  return rssResponse(
    renderRss({
      title: `${section.name} · Clarity60`,
      description: section.description ?? 'The world, explained.',
      path: `/rss/${section.slug}.xml`,
      items,
    }),
  )
}
