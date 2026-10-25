import { getSections, getSectionCategories } from '@/lib/data'
import { getRecentArticles } from '@/lib/feeds'
import { absolute } from '@/lib/schema'

/**
 * /llms.txt: a plain-language map of the site for AI assistants and answer engines
 * (the llmstxt.org convention): what Clarity60 is, how it is organised, latest stories.
 */
export async function GET() {
  const sections = await getSections()
  const blocks = await Promise.all(
    sections.map(async (s) => {
      const cats = await getSectionCategories(s.id)
      return [
        `### ${s.name}`,
        s.description ? `${s.description}` : '',
        `- [${s.name}](${absolute(`/${s.slug}`)})`,
        ...cats.map((c) => `- [${c.name}](${absolute(`/${s.slug}/${c.slug}`)})${c.description ? `: ${c.description}` : ''}`),
        `- RSS: ${absolute(`/rss/${s.slug}.xml`)}`,
      ]
        .filter(Boolean)
        .join('\n')
    }),
  )
  const latest = await getRecentArticles({ limit: 40 })

  const body = `# Clarity60

> Clarity60 publishes world news and evergreen explainers in plain English. Every story names its sources, every correction is published, and every article carries a byline and dates. The world, explained.

Content may be quoted with attribution and a link to the original article.

## Sections

${blocks.join('\n\n')}

## Latest stories

${latest
  .filter((a) => a.path)
  .map((a) => `- [${a.title}](${absolute(a.path!)})${a.summary ? `: ${a.summary}` : ''}`)
  .join('\n')}

## Machine-readable

- Sitemap: ${absolute('/sitemap.xml')}
- Google News sitemap: ${absolute('/news-sitemap.xml')}
- RSS (all stories): ${absolute('/rss.xml')}
- About and editorial standards: ${absolute('/about')}
- Corrections policy: ${absolute('/corrections')}
`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
