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
      ({ value, data }) => {
        const raw = typeof value === 'string' && value.trim() ? value : data?.[sourceField]
        return typeof raw === 'string' ? slugify(raw) : value
      },
    ],
  },
})
