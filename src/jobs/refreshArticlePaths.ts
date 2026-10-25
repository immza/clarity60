import type { TaskConfig, Where } from 'payload'

import { buildArticlePath } from '@/lib/articlePath'
import { idOf } from '@/lib/relations'

/**
 * After a section or category is renamed or moved, recompute the stored URL of every
 * article under it. Old URLs keep working through previousSlugs + canonical redirects.
 * Writes only the path columns, so it never touches drafts, versions or publish state.
 */
export const refreshArticlePaths: TaskConfig<'refreshArticlePaths'> = {
  slug: 'refreshArticlePaths',
  retries: 2,
  inputSchema: [
    { name: 'sectionId', type: 'number' },
    { name: 'categoryId', type: 'number' },
  ],
  outputSchema: [{ name: 'updated', type: 'number' }],
  handler: async ({ input, req }) => {
    const { payload } = req
    const where: Where = input.sectionId
      ? { section: { equals: input.sectionId } }
      : { or: [{ category: { equals: input.categoryId } }, { 'category.parent': { equals: input.categoryId } }] }

    let page = 1
    let updated = 0
    for (;;) {
      const batch = await payload.find({ collection: 'articles', where, depth: 0, limit: 100, page, req })
      for (const article of batch.docs) {
        const sectionId = idOf(article.section)
        const categoryId = idOf(article.category)
        if (!sectionId || !categoryId) continue
        const path = await buildArticlePath(payload, req, sectionId, categoryId, article.slug)
        if (path === article.path) continue
        await payload.db.updateOne({
          collection: 'articles',
          where: { id: { equals: article.id } },
          data: { path, ...(article._status === 'published' ? { publishedPath: path } : {}) },
          req,
        })
        updated++
      }
      if (!batch.hasNextPage) break
      page++
    }
    return { output: { updated } }
  },
}
