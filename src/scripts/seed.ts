/**
 * Idempotent seed: the two launch sections, regions, explainer subjects, the house author and ad slots.
 * Run with `npm run seed`. Safe to re-run; existing rows are left alone.
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const NEWS_REGIONS = [
  ['Asia', 'asia'],
  ['Europe', 'europe'],
  ['Americas', 'americas'],
  ['Africa', 'africa'],
  ['Middle East', 'middle-east'],
  ['Oceania', 'oceania'],
] as const

const EXPLAINER_SUBJECTS = [
  ['History', 'history', 'The people and moments that shaped today.'],
  ['Geography', 'geography', 'Borders, maps and strange places.'],
  ['Science', 'science', 'How the physical world actually works.'],
  ['Psychology', 'psychology', 'Why your brain does what it does.'],
  ['Space', 'space', 'Planets, stars and everything above.'],
  ['Crime Stories', 'crime-stories', 'True cases, explained.'],
  ['Odd Spot', 'odd-spot', 'Strange, true and hard to forget.'],
  ['How-Tos', 'how-tos', 'Clear steps for useful things.'],
  ['Self-Improvement', 'self-improvement', 'Evidence-based ways to get better.'],
] as const

const AD_SLOTS = [
  ['Front page sidebar', 'home-sidebar', '300x250'],
  ['Front page in-feed', 'home-in-feed', 'in-feed'],
  ['Section sidebar', 'section-sidebar', '300x250'],
  ['Article sidebar', 'article-sidebar', '300x250'],
  ['Article in-body', 'article-in-body', 'in-feed'],
  ['Section in-feed', 'section-in-feed', 'in-feed'],
] as const

const payload = await getPayload({ config })

const ensure = async <T extends Record<string, unknown>>(
  collection: 'sections' | 'categories' | 'authors' | 'ad-slots',
  where: Record<string, { equals: unknown }>,
  data: T,
) => {
  const existing = await payload.find({ collection, where, limit: 1, depth: 0 })
  if (existing.totalDocs > 0) return existing.docs[0]
  payload.logger.info(`seed: creating ${collection} ${JSON.stringify(where)}`)
  return payload.create({ collection, data: data as never })
}

const news = await ensure('sections', { slug: { equals: 'news' } }, {
  name: 'World News',
  slug: 'news',
  kind: 'news',
  kicker: 'Section · The News Desk',
  description: 'What happened today, where, and why it matters, in plain English.',
  sortOrder: 0,
})
const explainers = await ensure('sections', { slug: { equals: 'explainers' } }, {
  name: 'Explainers',
  slug: 'explainers',
  kind: 'evergreen',
  kicker: 'Section · The Knowledge Desk',
  description: "Everything we've ever explained, sorted by subject. Pick a desk.",
  sortOrder: 1,
})

for (const [i, [name, slug]] of NEWS_REGIONS.entries()) {
  await ensure('categories', { section: { equals: news.id }, slug: { equals: slug } }, {
    name,
    slug,
    section: news.id,
    sortOrder: i,
  })
}

for (const [i, [name, slug, description]] of EXPLAINER_SUBJECTS.entries()) {
  await ensure('categories', { section: { equals: explainers.id }, slug: { equals: slug } }, {
    name,
    slug,
    section: explainers.id,
    description,
    sortOrder: i,
  })
}

await ensure('authors', { slug: { equals: 'clarity60-desk' } }, {
  name: 'The Clarity60 Desk',
  slug: 'clarity60-desk',
  bio: 'The Clarity60 newsroom. The world, explained.',
})

for (const [label, key, size] of AD_SLOTS) {
  await ensure('ad-slots', { key: { equals: key } }, { label, key, size, mode: 'off' })
}

payload.logger.info('seed: done')
process.exit(0)
