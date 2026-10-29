import { getPayload } from 'payload'

import config from '@/payload.config'

export const dynamic = 'force-dynamic'

/**
 * Liveness + database check for DigitalOcean's health probe. A new version only
 * receives traffic once this returns 200. Reveals nothing beyond up/down.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    await payload.count({ collection: 'sections', overrideAccess: true })
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
