import type { CollectionConfig } from 'payload'

import { anyone, editorsOnly } from '@/access/roles'

/** Public corrections, stated plainly. Shown on the article and in the footer box. */
export const Corrections: CollectionConfig = {
  slug: 'corrections',
  admin: { useAsTitle: 'text', defaultColumns: ['article', 'text', 'date'], group: 'Content' },
  access: { read: anyone, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  defaultSort: '-date',
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true },
    { name: 'text', type: 'textarea', required: true, maxLength: 500 },
    { name: 'date', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
  ],
}
