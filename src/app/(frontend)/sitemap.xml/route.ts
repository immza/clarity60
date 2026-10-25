import { escapeXml, getArticleMonths, xmlResponse } from '@/lib/feeds'
import { absolute } from '@/lib/schema'

/** Sitemap index: one file for site structure, one per month of articles (scales to millions). */
export async function GET() {
  const months = await getArticleMonths()
  const files = ['/sitemaps/structure.xml', ...months.map((m) => `/sitemaps/articles-${m}.xml`)]
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `  <sitemap><loc>${escapeXml(absolute(f))}</loc></sitemap>`).join('\n')}
</sitemapindex>`
  return xmlResponse(body)
}
