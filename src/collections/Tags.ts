import type { CollectionConfig } from 'payload'

import { anyone, editorsOnly, staffOnly } from '@/access/roles'
import { slugField } from '@/fields/slug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug'], group: 'Content' },
  // Writers may create tags while drafting; only editors tidy them up.
  access: { read: anyone, create: staffOnly, update: editorsOnly, delete: editorsOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  fields: [
    { name: 'name', type: 'text', required: true },
    { ...slugField('name'), unique: true },
    { name: 'description', type: 'textarea', maxLength: 300 },
  ],
}
