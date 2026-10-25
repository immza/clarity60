import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import { TAGS } from '@/lib/cacheTags'
import config from '@/payload.config'

/**
 * Queries behind sitemaps, RSS and llms.txt. Light selects only; cached until
 * something is published (same tags as the pages).
 */
const payload = () => getPayload({ config })
const REVALIDATE = 3600

export const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export const xmlResponse = (body: string, maxAge = 900) =>
  new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  })

/** Months (YYYY-MM) that have at least one published article, newest first. */
export const getArticleMonths = unstable_cache(
  async () => {
    const months = new Set<string>()
    let page = 1
    for (;;) {
      const res = await (await payload()).find({
        collection: 'articles',
        sort: '-publishedAt',
        depth: 0,
        limit: 1000,
        page,
        overrideAccess: false,
        select: { publishedAt: true },
      })
      for (const d of res.docs) if (d.publishedAt) months.add(d.publishedAt.slice(0, 7))
      if (!res.hasNextPage) break
      page++
    }
    return [...months]
  },
  ['feed-article-months'],
  { tags: [TAGS.articles], revalidate: REVALIDATE },
)

/** Published articles in one month, for that month's sitemap (max 50k per file). */
export const getArticlesForMonth = unstable_cache(
  async (month: string) => {
    const start = new Date(`${month}-01T00:00:00.000Z`)
    const end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + 1)
    const res = await (await payload()).find({
      collection: 'articles',
      where: {
        and: [{ publishedAt: { greater_than_equal: start.toISOString() } }, { publishedAt: { less_than: end.toISOString() } }],
      },
      sort: '-publishedAt',
      depth: 1,
      limit: 50_000,
      overrideAccess: false,
      select: { path: true, updatedAt: true, title: true, heroMedia: true },
    })
    return res.docs
  },
  ['feed-articles-month'],
  { tags: [TAGS.articles], revalidate: REVALIDATE },
)

/** Recent published stories for feeds: optionally one section, optionally news-kind only, excluding sponsored. */
export const getRecentArticles = unstable_cache(
  async (opts: { sectionId?: number; newsOnly?: boolean; sinceHours?: number; limit?: number; includeSponsored?: boolean }) => {
    const and: Where[] = []
    if (opts.sectionId) and.push({ section: { equals: opts.sectionId } })
    if (opts.newsOnly) and.push({ 'section.kind': { equals: 'news' } })
    if (!opts.includeSponsored) and.push({ 'sponsorship.isSponsored': { not_equals: true } })
    if (opts.sinceHours)
      and.push({ publishedAt: { greater_than: new Date(Date.now() - opts.sinceHours * 3_600_000).toISOString() } })
    const res = await (await payload()).find({
      collection: 'articles',
      where: { and },
      sort: '-publishedAt',
      depth: 2,
      limit: opts.limit ?? 50,
      overrideAccess: false,
      select: {
        title: true,
        summary: true,
        path: true,
        publishedAt: true,
        updatedAt: true,
        heroMedia: true,
        category: true,
        section: true,
        authors: true,
        bylineOverride: true,
        tags: true,
      },
    })
    return res.docs
  },
  ['feed-recent'],
  { tags: [TAGS.articles], revalidate: 600 },
)

/** Structure URLs: sections, categories, tags, authors, published pages. */
export const getStructureUrls = unstable_cache(
  async () => {
    const p = await payload()
    const [sections, categories, tags, authors, pages] = await Promise.all([
      p.find({ collection: 'sections', depth: 0, limit: 100, overrideAccess: false, select: { slug: true, updatedAt: true } }),
      p.find({
        collection: 'categories',
        depth: 1,
        limit: 2000,
        overrideAccess: false,
        select: { slug: true, section: true, parent: true, updatedAt: true },
      }),
      p.find({ collection: 'tags', depth: 0, limit: 10_000, overrideAccess: false, select: { slug: true, updatedAt: true } }),
      p.find({ collection: 'authors', depth: 0, limit: 1000, overrideAccess: false, select: { slug: true, updatedAt: true } }),
      p.find({ collection: 'pages', depth: 0, limit: 200, overrideAccess: false, select: { slug: true, updatedAt: true } }),
    ])
    const urls: { path: string; lastmod: string }[] = [
      ...sections.docs.map((s) => ({ path: `/${s.slug}`, lastmod: s.updatedAt })),
      ...categories.docs.flatMap((c) => {
        const section = typeof c.section === 'object' ? c.section : null
        const parent = c.parent && typeof c.parent === 'object' ? c.parent : null
        if (!section) return []
        return [{ path: `/${section.slug}/${parent ? `${parent.slug}/` : ''}${c.slug}`, lastmod: c.updatedAt }]
      }),
      ...tags.docs.map((t) => ({ path: `/tag/${t.slug}`, lastmod: t.updatedAt })),
      ...authors.docs.map((a) => ({ path: `/author/${a.slug}`, lastmod: a.updatedAt })),
      ...pages.docs.map((pg) => ({ path: `/${pg.slug}`, lastmod: pg.updatedAt })),
    ]
    return urls
  },
  ['feed-structure'],
  { tags: [TAGS.articles, TAGS.sections, TAGS.categories, TAGS.pages], revalidate: REVALIDATE },
)
