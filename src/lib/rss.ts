import type { Author, Category, Media } from '@/payload-types'

import { escapeXml, type getRecentArticles } from './feeds'
import { absolute, SITE_URL } from './schema'

type Item = Awaited<ReturnType<typeof getRecentArticles>>[number]

const obj = <T,>(v: T | number | null | undefined): T | null => (v && typeof v === 'object' ? v : null)

/** RSS 2.0 with full-size images (media:content), for readers, aggregators and AI crawlers. */
export const renderRss = ({ title, description, path, items }: { title: string; description: string; path: string; items: Item[] }) => {
  const feedUrl = absolute(path)
  const entries = items
    .filter((a) => a.path)
    .map((a) => {
      const url = absolute(a.path!)
      const cat = obj<Category>(a.category)
      const img = obj<Media>(a.heroMedia)
      const authors = (a.authors ?? []).map((x) => obj<Author>(x)?.name).filter(Boolean)
      const byline = a.bylineOverride || (authors.length ? authors.join(', ') : 'The Clarity60 Desk')
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(a.summary ?? '')}</description>
      <dc:creator>${escapeXml(byline)}</dc:creator>
      ${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ''}
      ${cat ? `<category>${escapeXml(cat.name)}</category>` : ''}
      ${img?.url && !img.mimeType?.startsWith('video/') ? `<media:content url="${escapeXml(absolute(img.url))}" medium="image"${img.width ? ` width="${img.width}"` : ''}${img.height ? ` height="${img.height}"` : ''} />` : ''}
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${entries}
  </channel>
</rss>`
}

export const rssResponse = (body: string) =>
  new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
    },
  })
