import { escapeXml, getRecentArticles, xmlResponse } from '@/lib/feeds'
import { absolute } from '@/lib/schema'

/**
 * Google News sitemap: news-desk stories from the last 48 hours (Google's window),
 * never sponsored content. Submit it in Search Console and Google Publisher Center.
 */
export async function GET() {
  const articles = await getRecentArticles({ newsOnly: true, sinceHours: 48, limit: 1000 })
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${articles
  .filter((a) => a.path && a.publishedAt)
  .map(
    (a) => `  <url>
    <loc>${escapeXml(absolute(a.path!))}</loc>
    <news:news>
      <news:publication><news:name>Clarity60</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${a.publishedAt}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
  </url>`,
  )
  .join('\n')}
</urlset>`
  return xmlResponse(body, 300)
}
