import type { Payload, PayloadRequest } from 'payload'
import { ValidationError } from 'payload'

import { idOf } from './relations'

/** Builds /{section}/{category}[/{subcategory}]/{slug} from the live section and category slugs. */
export const buildArticlePath = async (
  payload: Payload,
  req: PayloadRequest | undefined,
  sectionId: number | string,
  categoryId: number | string,
  slug: string,
) => {
  const [section, category] = await Promise.all([
    payload.findByID({ collection: 'sections', id: sectionId, depth: 0, req }),
    payload.findByID({ collection: 'categories', id: categoryId, depth: 1, req }),
  ])
  if (idOf(category.section) !== section.id) {
    throw new ValidationError({
      errors: [{ path: 'category', message: 'Category must belong to the article’s section.' }],
    })
  }
  const parent = category.parent && typeof category.parent === 'object' ? category.parent : null
  return ['', section.slug, parent?.slug, category.slug, slug].filter((p) => p != null).join('/')
}

/**
 * Remembers a slug the doc used to have, so old URLs can still be resolved and
 * 301'd to the current one after a section or category is renamed.
 */
export const trackPreviousSlug = ({
  data,
  originalDoc,
}: {
  data: Record<string, unknown>
  originalDoc?: { slug?: string | null; previousSlugs?: string[] | null }
}) => {
  const oldSlug = originalDoc?.slug
  const newSlug = data.slug
  if (!oldSlug || typeof newSlug !== 'string' || newSlug === oldSlug) return data
  const history = new Set([...(originalDoc?.previousSlugs ?? []), oldSlug])
  history.delete(newSlug)
  data.previousSlugs = [...history]
  return data
}
