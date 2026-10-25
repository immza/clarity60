import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

/**
 * Clears the cached public pages that depend on a collection. Outside a Next.js
 * request (seed scripts, tests, jobs) there is no cache to clear, so it is a no-op.
 */
const clear = (tag: string, req: { payload: { logger: { debug: (msg: string) => void } } }) => {
  try {
    revalidateTag(tag, 'max')
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
