import type { GlobalConfig } from 'payload'

import type { Field } from 'payload'

import { anyone, superAdminOnly } from '@/access/roles'

type EarDefaults = { kind: 'custom' | 'storiesToday'; label: string; text: string; link?: string }

/** One masthead "ear": a heading, a line of text, optional link, or a live story count. */
const earField = (name: string, label: string, defaults: EarDefaults): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: false },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: defaults.kind,
      options: [
        { label: 'Custom text', value: 'custom' },
        { label: 'Live count: "{N} new stories"', value: 'storiesToday' },
      ],
    },
    { name: 'label', type: 'text', defaultValue: defaults.label, admin: { description: 'Small heading, e.g. "Follow @theclarity60"' } },
    {
      name: 'text',
      type: 'text',
      defaultValue: defaults.text,
      admin: { description: 'Custom text, or the fallback when the live count is zero.' },
    },
    { name: 'link', type: 'text', defaultValue: defaults.link, admin: { description: 'Optional. Makes the whole box a link.' } },
  ],
})

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
      type: 'collapsible',
      label: 'Masthead ears (optional boxes beside CLARITY60 on the front page; off by default)',
      fields: [earField('leftEar', 'Left ear', {
        kind: 'custom',
        label: 'Follow @theclarity60',
        text: 'The 60-second version, on Instagram.',
        link: 'https://www.instagram.com/theclarity60/',
      }), earField('rightEar', 'Right ear', {
        kind: 'storiesToday',
        label: 'Today',
        text: 'Fresh stories, every day.',
      })],
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
