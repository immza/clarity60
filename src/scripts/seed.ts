/**
 * Idempotent seed: the two launch sections, regions, explainer subjects, the house author and ad slots.
 * Run with `npm run seed`. Safe to re-run; existing rows are left alone.
 */
import { getPayload } from 'payload'

import config from '../payload.config'
import { PAGE_TEMPLATES } from './pageTemplates'

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
  ['Article end', 'article-end', 'in-feed'],
] as const

const payload = await getPayload({ config })

const ensure = async <T extends Record<string, unknown>>(
  collection: 'sections' | 'categories' | 'authors' | 'ad-slots' | 'promotions',
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

// Starter house promotions. They only appear in slots switched to a mode other than "off".
await ensure('promotions', { title: { equals: 'Instagram follow' } }, {
  title: 'Instagram follow',
  label: 'From Clarity60',
  headline: 'The 60-second version, on Instagram',
  text: 'Every big story, explained in a minute. Follow @theclarity60.',
  ctaLabel: 'Follow',
  link: 'https://www.instagram.com/theclarity60/',
  weight: 2,
})
await ensure('promotions', { title: { equals: 'Advertise with us' } }, {
  title: 'Advertise with us',
  label: 'From Clarity60',
  headline: 'Put your brand in the paper',
  text: 'Vintage-style placements for modern brands, seen by curious readers.',
  ctaLabel: 'Ask for the media kit',
  link: '/advertise',
  weight: 1,
})

// Standard pages, published once with starter text; edit them in Admin → Pages.
for (const tpl of PAGE_TEMPLATES) {
  const exists = await payload.count({ collection: 'pages', where: { slug: { equals: tpl.slug } } })
  if (exists.totalDocs) continue
  await payload.create({
    collection: 'pages',
    data: {
      title: tpl.title,
      slug: tpl.slug,
      body: tpl.body as never,
      meta: { title: `${tpl.title} · Clarity60`, description: tpl.description },
      _status: 'published',
    },
  })
  payload.logger.info(`seed: page /${tpl.slug}`)
}

// First Super Admin, created before the site is ever reachable (see docs/LAUNCH.md).
// Only when no staff exist yet; the password must be changed and 2FA set up on first login.
const adminEmail = process.env.SEED_ADMIN_EMAIL
const adminPassword = process.env.SEED_ADMIN_PASSWORD
if (adminEmail && adminPassword) {
  const { totalDocs } = await payload.count({ collection: 'users' })
  if (totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email: adminEmail, password: adminPassword, name: process.env.SEED_ADMIN_NAME || 'Super Admin', role: 'super-admin' },
    })
    payload.logger.info(`seed: created Super Admin ${adminEmail}`)
  }
}

payload.logger.info('seed: done')
process.exit(0)
