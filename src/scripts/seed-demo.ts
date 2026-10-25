/**
 * Local-only demo stories (from the design PDF) so pages can be reviewed before real
 * content exists. Run `npm run seed:demo`. Refuses to run in production. Re-running
 * skips stories that already exist. Delete them from the admin before launch.
 */
import { getPayload } from 'payload'

import config from '../payload.config'

if (process.env.NODE_ENV === 'production') {
  console.error('seed:demo is for local development only.')
  process.exit(1)
}

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  textFormat: 0,
  children: [{ type: 'text', text, version: 1, format: 0, mode: 'normal', style: '', detail: 0 }],
})

const body = (...paras: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paras.map(paragraph),
  },
})

const filler =
  'This is demo copy for reviewing the layout. Real reporting replaces it before launch, written in plain English and checked against the sources listed below.'

type Demo = {
  title: string
  summary: string
  section: 'news' | 'explainers'
  category: string
  hoursAgo: number
  paras: number
  featured?: boolean
  topStory?: boolean
  developing?: boolean
  sources?: string[]
  ig?: boolean
}

const DEMOS: Demo[] = [
  { title: 'How a Steel Box Rebuilt the World Economy', summary: 'In 1956, a trucking man named Malcolm McLean loaded 58 metal boxes onto a ship in New Jersey. Trade was never the same again.', section: 'explainers', category: 'history', hoursAgo: 1, paras: 9, featured: true, sources: ['The Box, Marc Levinson (2006)', 'Port Authority of NY & NJ'] },
  { title: 'Ceasefire Talks Resume as Aid Convoys Wait at the Border', summary: 'Negotiators return to the table after a week-long pause. Here is what each side wants, and why the crossings matter.', section: 'news', category: 'middle-east', hoursAgo: 2, paras: 6, topStory: true, developing: true, sources: ['Reuters', 'UN OCHA'], ig: true },
  { title: 'The Shortest War in History Lasted Under an Hour', summary: 'In 1896, Britain and Zanzibar went to war. It was over before most people finished breakfast.', section: 'explainers', category: 'history', hoursAgo: 4, paras: 7 },
  { title: 'Japan Approves Record Budget as Population Keeps Shrinking', summary: 'More money for childcare and defence, fewer workers to pay for it. What the numbers say about Japan’s next decade.', section: 'news', category: 'asia', hoursAgo: 5, paras: 5, sources: ['Japan Ministry of Finance', 'NHK'] },
  { title: 'Why China Runs on a Single Time Zone', summary: 'A country wide enough for five time zones sets every clock to Beijing.', section: 'explainers', category: 'geography', hoursAgo: 6, paras: 6 },
  { title: 'EU Leaders Agree on New Rules for AI in Public Services', summary: 'The deal sets limits on facial recognition and requires plain-language notices. Here is who it affects.', section: 'news', category: 'europe', hoursAgo: 7, paras: 5, ig: true },
  { title: 'Flamingos Aren’t Born Pink', summary: 'Their color comes from what they eat, and it can fade.', section: 'explainers', category: 'science', hoursAgo: 8, paras: 5 },
  { title: 'Brazil’s Drought Pushes Amazon River to Historic Low', summary: 'Cargo barges are stranded and riverside towns are running short of water. Scientists explain what is driving it.', section: 'news', category: 'americas', hoursAgo: 9, paras: 5 },
  { title: 'Why Déjà Vu Happens', summary: 'What scientists think is going on, and what is still unknown.', section: 'explainers', category: 'psychology', hoursAgo: 11, paras: 6 },
  { title: 'Kenya Opens Africa’s Largest Geothermal Plant Expansion', summary: 'The Rift Valley project adds enough power for two million homes. How underground heat became Kenya’s biggest energy source.', section: 'news', category: 'africa', hoursAgo: 13, paras: 5 },
  { title: 'A Day on Venus Is Longer Than Its Year', summary: 'The slowest spinning planet in the solar system.', section: 'explainers', category: 'space', hoursAgo: 20, paras: 4 },
  { title: 'Honey That Never Spoils', summary: 'Why archaeologists have found it still edible.', section: 'explainers', category: 'odd-spot', hoursAgo: 26, paras: 4 },
  { title: 'Pacific Islands Sign Regional Climate Finance Pact', summary: 'Twelve nations pool funds to move coastal villages. What the agreement does and does not cover.', section: 'news', category: 'oceania', hoursAgo: 30, paras: 5 },
  { title: 'Why Airplane Windows Are Round', summary: 'Square windows once cost lives.', section: 'explainers', category: 'science', hoursAgo: 34, paras: 5 },
]

const payload = await getPayload({ config })

const sections = await payload.find({ collection: 'sections', limit: 50, depth: 0 })
const sectionId = (slug: string) => sections.docs.find((s) => s.slug === slug)?.id
const desk = await payload.find({ collection: 'authors', where: { slug: { equals: 'clarity60-desk' } }, limit: 1 })

for (const d of DEMOS) {
  const sid = sectionId(d.section)
  if (!sid) throw new Error(`Run "npm run seed" first: section "${d.section}" is missing.`)
  const cat = await payload.find({
    collection: 'categories',
    where: { and: [{ section: { equals: sid } }, { slug: { equals: d.category } }] },
    limit: 1,
  })
  if (!cat.docs[0]) throw new Error(`Category "${d.category}" is missing.`)

  const exists = await payload.find({ collection: 'articles', where: { title: { equals: d.title } }, limit: 1 })
  if (exists.totalDocs) continue

  const publishedAt = new Date(Date.now() - d.hoursAgo * 3_600_000)
  await payload.create({
    collection: 'articles',
    data: {
      title: d.title,
      slug: '',
      summary: d.summary,
      section: sid,
      category: cat.docs[0].id,
      authors: desk.docs[0] ? [desk.docs[0].id] : [],
      body: body(d.summary, ...Array.from({ length: d.paras }, () => filler)),
      publishedAt: publishedAt.toISOString(),
      featured: d.featured ?? false,
      topStory: d.topStory ?? false,
      sources: (d.sources ?? []).map((outlet) => ({ outlet })),
      instagramUrl: d.ig ? 'https://www.instagram.com/theclarity60/' : undefined,
      developing: d.developing
        ? {
            isDeveloping: true,
            updates: [
              { at: new Date(publishedAt.getTime() + 3 * 3_600_000).toISOString(), text: 'Delegations confirm talks will continue tomorrow morning.' },
              { at: new Date(publishedAt.getTime() + 1 * 3_600_000).toISOString(), text: 'First convoy of 40 trucks cleared for inspection.' },
              { at: publishedAt.toISOString(), text: 'Negotiators arrive; both sides describe the mood as cautious.' },
            ],
          }
        : undefined,
      _status: 'published',
    },
  })
  payload.logger.info(`seed:demo: published "${d.title}"`)
}

const corrected = (await payload.find({ collection: 'articles', where: { title: { equals: DEMOS[2].title } }, limit: 1 })).docs[0]
const hasCorrection = await payload.count({ collection: 'corrections', where: { article: { equals: corrected.id } } })
if (!hasCorrection.totalDocs) {
  await payload.create({
    collection: 'corrections',
    data: {
      article: corrected.id,
      text: 'An earlier version gave the war’s length as 45 minutes. Most accounts put it at 38 to 45 minutes.',
      date: new Date().toISOString(),
    },
  })
}

payload.logger.info('seed:demo: done')
process.exit(0)
