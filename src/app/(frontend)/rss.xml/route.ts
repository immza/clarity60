import { getRecentArticles } from '@/lib/feeds'
import { renderRss, rssResponse } from '@/lib/rss'

/** /rss.xml: every desk, newest 50 stories. */
export async function GET() {
  const items = await getRecentArticles({ limit: 50 })
  return rssResponse(
    renderRss({ title: 'Clarity60', description: 'The world, explained.', path: '/rss.xml', items }),
  )
}
