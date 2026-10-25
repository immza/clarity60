import type { CollectionConfig } from 'payload'

import { anyone, editorsOnly, superAdminOnly } from '@/access/roles'
import { slugField } from '@/fields/slug'

/** Public bylines and author pages (schema.org Person). */
export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug'], group: 'Content' },
  access: { read: anyone, create: editorsOnly, update: editorsOnly, delete: superAdminOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  fields: [
    { name: 'name', type: 'text', required: true },
    { ...slugField('name'), unique: true },
    { name: 'jobTitle', type: 'text', admin: { description: 'e.g. "Explainers Editor"' } },
    { name: 'bio', type: 'textarea', maxLength: 600 },
    {
      name: 'credentials',
      type: 'textarea',
      maxLength: 400,
      admin: { description: 'Expertise and background. Shown on the author page; helps E-E-A-T.' },
    },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'socials',
      type: 'array',
      admin: { description: 'Profile links (used as schema.org sameAs).' },
      fields: [{ name: 'url', type: 'text', required: true }],
    },
  ],
}
