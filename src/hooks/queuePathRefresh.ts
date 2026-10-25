import type { CollectionAfterChangeHook } from 'payload'

import { idOf } from '@/lib/relations'

/** When a section/category URL (slug or parent) changes, refresh affected article paths in the background. */
export const queuePathRefresh =
  (kind: 'section' | 'category'): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, operation, req }) => {
    if (operation !== 'update') return doc
    const moved = doc.slug !== previousDoc?.slug || idOf(doc.parent) !== idOf(previousDoc?.parent)
    if (!moved) return doc
    await req.payload.jobs.queue({
      task: 'refreshArticlePaths',
      input: kind === 'section' ? { sectionId: doc.id } : { categoryId: doc.id },
      req,
    })
    return doc
  }
