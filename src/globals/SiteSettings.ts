import type { GlobalConfig } from 'payload'

import { anyone, superAdminOnly } from '@/access/roles'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Admin' },
  access: { read: anyone, update: superAdminOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  fields: [
    { name: 'tagline', type: 'text', required: true, defaultValue: 'The world, explained.' },
    {
      name: 'inFeedAdEvery',
      type: 'number',
      required: true,
      defaultValue: 6,
      min: 3,
      admin: { description: 'Show an in-feed ad after every N stories.' },
    },
    {
      name: 'navExtras',
      type: 'array',
      label: 'Extra navigation links',
      admin: {
        description: 'Sections marked "Show in nav" appear automatically. Add anything else here (e.g. Puzzles, The Newsreel).',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'socials',
      type: 'group',
      fields: [
        { name: 'instagram', type: 'text', defaultValue: 'https://www.instagram.com/theclarity60/' },
        { name: 'youtube', type: 'text' },
        { name: 'x', type: 'text', label: 'X / Twitter' },
        { name: 'facebook', type: 'text' },
      ],
    },
  ],
}
