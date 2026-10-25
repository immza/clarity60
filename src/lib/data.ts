import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

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
