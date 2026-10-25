import type { CollectionConfig } from 'payload'

import { editorsOnly, publishedOrStaff, superAdminOnly } from '@/access/roles'
import { slugField } from '@/fields/slug'

/** Static pages: About, Contact, Privacy, Cookies, Terms, Advertise. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', '_status'], group: 'Content' },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrStaff, create: editorsOnly, update: editorsOnly, delete: superAdminOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  fields: [
    { name: 'title', type: 'text', required: true },
    { ...slugField('title'), unique: true },
    { name: 'body', type: 'richText', required: true },
  ],
}
