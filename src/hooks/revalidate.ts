import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

/**
 * Clears the cached public pages that depend on a collection. `expire: 0` makes the next
 * request fetch fresh data: with stale-while-revalidate it would get the old copy, and the
 * CDN would then hold that copy for minutes. Outside a Next.js request (seed scripts, tests,
 * scheduled publishes) this cannot run, so those rely on the short timed refresh in lib/data.
 */
const clear = (tag: string, req: { payload: { logger: { debug: (msg: string) => void } } }) => {
  try {
    revalidateTag(tag, { expire: 0 })
  } catch {
    req.payload.logger.debug(`revalidate: skipped "${tag}" (no Next.js request context)`)
  }
}

export const revalidateAfterChange =
  (tag: string): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    clear(tag, req)
    return doc
  }

export const revalidateAfterDelete =
  (tag: string): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    clear(tag, req)
    return doc
  }

export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req }) => {
    clear(tag, req)
    return doc
  }
