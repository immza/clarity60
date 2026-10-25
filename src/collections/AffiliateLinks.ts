import type { CollectionConfig } from 'payload'

import { anyone, editorsOnly, isStaff, superAdminOnly } from '@/access/roles'
import { slugField } from '@/fields/slug'

/**
 * Partner links (Amazon, Booking.com, courses...). Articles link to these rather than to
 * raw partner URLs, so every click goes through /go/{slug}: counted, marked sponsored,
 * and fixable in one place if a partner changes its URL.
 */
export const AffiliateLinks: CollectionConfig = {
  slug: 'affiliate-links',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'partner', 'clicks', 'updatedAt'],
    group: 'Revenue',
    description: 'Link to these from articles (Link → Internal → Affiliate Links) or use the "Recommended" block.',
  },
  // Public pages need the slug to build /go/ links; internal notes and click counts stay staff-only.
  access: { read: anyone, create: editorsOnly, update: editorsOnly, delete: superAdminOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. "Celestron 70mm telescope"' } },
    { ...slugField('name'), unique: true, admin: { position: 'sidebar', description: 'Used in clarity60.com/go/{slug}.' } },
    { name: 'partner', type: 'text', admin: { description: 'e.g. Amazon Associates, Booking.com' } },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: { description: 'The full partner URL with your tracking ID.' },
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'A URL is required.'
        try {
          return new URL(value).protocol === 'https:' ? true : 'Use an https:// link.'
        } catch {
          return 'Enter a full URL, starting with https://'
        }
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      access: { read: ({ req: { user } }) => isStaff(user) },
      admin: { description: 'Internal only: commission rate, expiry, contact.' },
    },
    {
      name: 'clicks',
      type: 'number',
      defaultValue: 0,
      access: { read: ({ req: { user } }) => isStaff(user) },
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
