import { getPayload, type Where } from 'payload'

import { CARD_SELECT } from '@/lib/data'
import config from '@/payload.config'

/**
 * Published stories whose headline or standfirst contains every word, newest first.
 * Not cached: queries are open-ended, and caching each one would let anyone fill the cache.
 */
export async function searchArticles(terms: string[], page = 1, limit = 20) {
  const payload = await getPayload({ config })
  const where: Where = {
    and: terms.map((word): Where => ({ or: [{ title: { like: word } }, { summary: { like: word } }] })),
  }
  return payload.find({
    collection: 'articles',
    where,
    sort: '-publishedAt',
    depth: 1,
    page,
    limit,
    overrideAccess: false,
    select: CARD_SELECT,
  })
}
