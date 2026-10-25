import { escapeXml, getArticlesForMonth, getStructureUrls, xmlResponse } from '@/lib/feeds'
import { absolute } from '@/lib/schema'
import type { Media } from '@/payload-types'

const urlset = (entries: string[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`

/** /sitemaps/structure.xml and /sitemaps/articles-YYYY-MM.xml */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  if (name === 'structure.xml') {
    const urls = await getStructureUrls()
    const entries = [
      `  <url><loc>${escapeXml(absolute('/'))}</loc><changefreq>hourly</changefreq></url>`,
      ...urls.map((u) => `  <url><loc>${escapeXml(absolute(u.path))}</loc><lastmod>${u.lastmod}</lastmod></url>`),
    ]
    return xmlResponse(urlset(entries))
  }

  const month = /^articles-(\d{4}-\d{2})\.xml$/.exec(name)?.[1]
  if (!month) return new Response('Not found', { status: 404 })

  const articles = await getArticlesForMonth(month)
  if (!articles.length) return new Response('Not found', { status: 404 })
  const entries = articles
    .filter((a) => a.path)
    .map((a) => {
      const img = a.heroMedia && typeof a.heroMedia === 'object' ? (a.heroMedia as Media) : null
      const image =
        img?.url && !img.mimeType?.startsWith('video/')
          ? `<image:image><image:loc>${escapeXml(absolute(img.url))}</image:loc></image:image>`
          : ''
      return `  <url><loc>${escapeXml(absolute(a.path!))}</loc><lastmod>${a.updatedAt}</lastmod>${image}</url>`
    })
  return xmlResponse(urlset(entries))
}
