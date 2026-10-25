import { sql } from '@payloadcms/db-postgres'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import config from '@/payload.config'

const headers = {
  // Keep tracking URLs out of search results and do not pass our page URL to partners.
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store',
}

/** /go/{slug}: counts the click, then sends the reader to the partner URL. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'affiliate-links',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    select: { url: true },
  })
  const link = docs[0]
  if (!link?.url) return new Response('Not found', { status: 404, headers })

  try {
    // Atomic increment, so simultaneous clicks are never lost.
    const db = payload.db as unknown as PostgresAdapter
    await db.drizzle.execute(sql`update affiliate_links set clicks = coalesce(clicks, 0) + 1 where id = ${link.id}`)
  } catch (err) {
    payload.logger.error({ err }, 'affiliate click count failed')
  }

  return new Response(null, { status: 302, headers: { ...headers, Location: link.url } })
}
