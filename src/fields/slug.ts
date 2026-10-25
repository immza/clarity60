import type { TextField } from 'payload'

import { slugify } from '@/lib/text'

/**
 * Slug field that fills itself from `sourceField` when left empty and is
 * always normalised. Uniqueness is checked by each collection, because the
 * scope differs (per section for articles, per parent for categories).
 */
export const slugField = (sourceField = 'title'): TextField => ({
  name: 'slug',
  type: 'text',
  index: true,
  required: true,
  admin: {
    position: 'sidebar',
    description: 'Used in the URL. Leave blank to generate from the title. Changing it later creates a redirect.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data, operation }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        // Only regenerate on create or when the slug was explicitly cleared, so a
        // title-only edit never silently changes a live URL.
        const cleared = Boolean(data && 'slug' in data)
        if (operation !== 'create' && !cleared) return value
        const source = data?.[sourceField]
        return typeof source === 'string' ? slugify(source) : value
      },
    ],
  },
})
