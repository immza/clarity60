import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import { TAGS } from '@/lib/cacheTags'
import config from '@/payload.config'

// Pages are cached until something is published; this is only a safety net.
const FALLBACK_REVALIDATE = 3600

const payload = () => getPayload({ config })

export const getSections = unstable_cache(
  async () => {
    const { docs } = await (await payload()).find({
      collection: 'sections',
      sort: 'sortOrder',
      depth: 0,
      limit: 50,
      overrideAccess: false,
    })
    return docs
  },
  ['sections'],
  { tags: [TAGS.sections], revalidate: FALLBACK_REVALIDATE },
)

export const getSiteSettings = unstable_cache(
  async () => (await payload()).findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: false }),
  ['site-settings'],
  { tags: [TAGS.settings], revalidate: FALLBACK_REVALIDATE },
)

/** One latest published headline per news category, for The Wire ticker. */
export const getWireHeadlines = unstable_cache(
  async () => {
    const p = await payload()
    const { docs } = await p.find({
      collection: 'articles',
      where: { 'section.kind': { equals: 'news' } },
      sort: '-publishedAt',
      depth: 1,
      limit: 40,
      overrideAccess: false,
      select: { title: true, path: true, category: true, publishedAt: true },
    })
    const seen = new Set<string | number>()
    const items: { title: string; path: string; label: string }[] = []
    for (const doc of docs) {
      const cat = typeof doc.category === 'object' && doc.category ? doc.category : null
      if (!cat || seen.has(cat.id) || !doc.path) continue
      seen.add(cat.id)
      items.push({ title: doc.title, path: doc.path, label: cat.name })
      if (items.length === 8) break
    }
    return items
  },
  ['wire-headlines'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

/** Most recent correction, for the footer box. */
export const getLatestCorrection = unstable_cache(
  async () => {
    const { docs } = await (await payload()).find({
      collection: 'corrections',
      sort: '-date',
      depth: 1,
      limit: 1,
      overrideAccess: false,
    })
    const c = docs[0]
    if (!c) return null
    const article = typeof c.article === 'object' ? c.article : null
    return { text: c.text, path: article?._status === 'published' ? (article.path ?? null) : null }
  },
  ['latest-correction'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

/** Finds a section by its current slug, or by an old one (so the caller can 301). */
export const getSectionBySlug = unstable_cache(
  async (slug: string) => {
    const { docs } = await (await payload()).find({
      collection: 'sections',
      where: { or: [{ slug: { equals: slug } }, { previousSlugs: { in: [slug] } }] },
      depth: 0,
      limit: 1,
      overrideAccess: false,
    })
    return docs[0] ?? null
  },
  ['section-by-slug'],
  { tags: [TAGS.sections], revalidate: FALLBACK_REVALIDATE },
)

/** Top-level categories of a section, in editor-defined order. */
export const getSectionCategories = unstable_cache(
  async (sectionId: number) => {
    const { docs } = await (await payload()).find({
      collection: 'categories',
      where: { and: [{ section: { equals: sectionId } }, { parent: { exists: false } }] },
      sort: 'sortOrder',
      depth: 0,
      limit: 100,
      overrideAccess: false,
    })
    return docs
  },
  ['section-categories'],
  { tags: [TAGS.categories], revalidate: FALLBACK_REVALIDATE },
)

/** Fields a story card needs; keeps list queries light. */
const CARD_SELECT = {
  title: true,
  summary: true,
  path: true,
  publishedAt: true,
  columnInches: true,
  readingMinutes: true,
  heroMedia: true,
  category: true,
  section: true,
  instagramUrl: true,
  featured: true,
  topStory: true,
  developing: true,
} as const

export type ListArgs = {
  sectionId?: number
  categoryIds?: number[]
  tagId?: number
  authorId?: number
  excludeIds?: number[]
  featured?: boolean
  topStory?: boolean
  page?: number
  limit?: number
}

/** Published stories, newest first, for any listing (front page, section, category, tag, author). */
export const listArticles = unstable_cache(
  async (args: ListArgs) => {
    const and: Where[] = []
    if (args.sectionId) and.push({ section: { equals: args.sectionId } })
    if (args.categoryIds?.length) and.push({ category: { in: args.categoryIds } })
    if (args.tagId) and.push({ tags: { in: [args.tagId] } })
    if (args.authorId) and.push({ authors: { in: [args.authorId] } })
    if (args.excludeIds?.length) and.push({ id: { not_in: args.excludeIds } })
    if (args.featured) and.push({ featured: { equals: true } })
    if (args.topStory) and.push({ topStory: { equals: true } })
    return (await payload()).find({
      collection: 'articles',
      where: { and },
      sort: '-publishedAt',
      depth: 1,
      page: args.page ?? 1,
      limit: args.limit ?? 12,
      overrideAccess: false,
      select: CARD_SELECT,
    })
  },
  ['list-articles'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

export type CardArticle = Awaited<ReturnType<typeof listArticles>>['docs'][number]

/** A published article by section + slug (unique per section), fully populated for its page. */
export const getArticle = unstable_cache(
  async (sectionId: number, slug: string) => {
    const { docs } = await (await payload()).find({
      collection: 'articles',
      where: { and: [{ section: { equals: sectionId } }, { slug: { equals: slug } }] },
      depth: 2,
      limit: 1,
      overrideAccess: false,
    })
    return docs[0] ?? null
  },
  ['article'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

/** Category by slug (current or previous) within a section and parent. */
export const getCategory = unstable_cache(
  async (sectionId: number, slug: string, parentId: number | null) => {
    const { docs } = await (await payload()).find({
      collection: 'categories',
      where: {
        and: [
          { section: { equals: sectionId } },
          { or: [{ slug: { equals: slug } }, { previousSlugs: { in: [slug] } }] },
          parentId ? { parent: { equals: parentId } } : { parent: { exists: false } },
        ],
      },
      depth: 1,
      limit: 1,
      overrideAccess: false,
    })
    return docs[0] ?? null
  },
  ['category'],
  { tags: [TAGS.categories], revalidate: FALLBACK_REVALIDATE },
)

export const getSubcategories = unstable_cache(
  async (parentId: number) => {
    const { docs } = await (await payload()).find({
      collection: 'categories',
      where: { parent: { equals: parentId } },
      sort: 'sortOrder',
      depth: 0,
      limit: 100,
      overrideAccess: false,
    })
    return docs
  },
  ['subcategories'],
  { tags: [TAGS.categories], revalidate: FALLBACK_REVALIDATE },
)

/** Exact-path redirect, resolved to its current target URL. */
export const getRedirect = unstable_cache(
  async (from: string) => {
    const { docs } = await (await payload()).find({
      collection: 'redirects',
      where: { from: { equals: from } },
      depth: 1,
      limit: 1,
      overrideAccess: true,
    })
    const r = docs[0]
    if (!r) return null
    if (r.to?.type === 'custom') return r.to.url ?? null
    const ref = r.to?.reference?.value
    return ref && typeof ref === 'object' && 'path' in ref && typeof ref.path === 'string' ? ref.path : null
  },
  ['redirect'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

export const getTag = unstable_cache(
  async (slug: string) => {
    const { docs } = await (await payload()).find({
      collection: 'tags',
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: false,
    })
    return docs[0] ?? null
  },
  ['tag'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

export const getAuthor = unstable_cache(
  async (slug: string) => {
    const { docs } = await (await payload()).find({
      collection: 'authors',
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
      overrideAccess: false,
    })
    return docs[0] ?? null
  },
  ['author'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

export const getPage = unstable_cache(
  async (slug: string) => {
    const { docs } = await (await payload()).find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      depth: 1,
      limit: 1,
      overrideAccess: false,
    })
    return docs[0] ?? null
  },
  ['page'],
  { tags: [TAGS.pages], revalidate: FALLBACK_REVALIDATE },
)

export const getAdSlot = unstable_cache(
  async (key: string) => {
    const { docs } = await (await payload()).find({
      collection: 'ad-slots',
      where: { key: { equals: key } },
      depth: 1,
      limit: 1,
      overrideAccess: false,
    })
    return docs[0] ?? null
  },
  ['ad-slot'],
  { tags: [TAGS.settings], revalidate: FALLBACK_REVALIDATE },
)

/** Corrections attached to one article, newest first. */
export const getCorrectionsFor = unstable_cache(
  async (articleId: number) => {
    const { docs } = await (await payload()).find({
      collection: 'corrections',
      where: { article: { equals: articleId } },
      sort: '-date',
      depth: 0,
      limit: 20,
      overrideAccess: false,
    })
    return docs
  },
  ['corrections-for'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

/** Every category, for the side navigation drawer. */
export const getAllCategories = unstable_cache(
  async () => {
    const { docs } = await (await payload()).find({
      collection: 'categories',
      sort: 'sortOrder',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      select: { name: true, slug: true, section: true, parent: true, sortOrder: true },
    })
    return docs
  },
  ['all-categories'],
  { tags: [TAGS.categories], revalidate: FALLBACK_REVALIDATE },
)

/** When the newest published story was last published or edited ("Last updated"). */
export const getLastUpdated = unstable_cache(
  async () => {
    const { docs } = await (await payload()).find({
      collection: 'articles',
      sort: '-updatedAt',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      select: { updatedAt: true },
    })
    return docs[0]?.updatedAt ?? null
  },
  ['last-updated'],
  { tags: [TAGS.articles], revalidate: FALLBACK_REVALIDATE },
)

/** Stories published in the last 24 hours (the "Today" masthead ear). */
export const getStoriesTodayCount = unstable_cache(
  async () => {
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString()
    const { totalDocs } = await (await payload()).count({
      collection: 'articles',
      where: { publishedAt: { greater_than: since } },
      overrideAccess: false,
    })
    return totalDocs
  },
  ['stories-today'],
  // Time-based as well as tag-based: the 24h window moves even when nothing is published.
  { tags: [TAGS.articles], revalidate: 900 },
)

/** All currently active house promotions; filtered per slot/section/category by the caller. */
export const getActivePromotions = unstable_cache(
  async () => {
    const now = new Date().toISOString()
    const { docs } = await (await payload()).find({
      collection: 'promotions',
      where: {
        and: [
          { active: { equals: true } },
          { or: [{ startsAt: { exists: false } }, { startsAt: { less_than_equal: now } }] },
          { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: now } }] },
        ],
      },
      depth: 1,
      limit: 100,
      overrideAccess: false,
    })
    return docs
  },
  ['active-promotions'],
  // Also time-based so scheduled promos start and stop without a publish.
  { tags: [TAGS.settings], revalidate: 600 },
)
