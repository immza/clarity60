import type { CollectionConfig } from 'payload'

import { anyone, superAdminOnly } from '@/access/roles'

/** Fixed sizes reserve space up front so ads never shift the layout (CLS). */
export const AD_SIZES = [
  { label: 'Sidebar 300×250', value: '300x250' },
  { label: 'Leaderboard 728×90', value: '728x90' },
  { label: 'In-feed (fluid, 250px tall)', value: 'in-feed' },
  { label: 'Mobile banner 320×100', value: '320x100' },
] as const

export const AdSlots: CollectionConfig = {
  slug: 'ad-slots',
  admin: { useAsTitle: 'label', defaultColumns: ['label', 'key', 'mode', 'size'], group: 'Revenue' },
  access: { read: anyone, create: superAdminOnly, update: superAdminOnly, delete: superAdminOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  fields: [
    { name: 'label', type: 'text', required: true },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Placement id used by the site, e.g. "home-sidebar". Do not change once live.' },
    },
    {
      name: 'mode',
      type: 'select',
      required: true,
      defaultValue: 'off',
      options: [
        { label: 'Off (space collapses)', value: 'off' },
        { label: 'House promotions (from Revenue → Promotions)', value: 'house' },
        { label: 'Google AdSense (falls back to house promotions until approved)', value: 'adsense' },
        { label: 'Direct-sold ad (falls back to house promotions outside its dates)', value: 'direct' },
      ],
      admin: { description: 'At most three ads show on an article page, whatever is switched on.' },
    },
    { name: 'size', type: 'select', required: true, options: [...AD_SIZES] },
    {
      name: 'adsenseSlotId',
      type: 'text',
      admin: { condition: (_, s) => s?.mode === 'adsense', description: 'The data-ad-slot value from AdSense.' },
    },
    {
      name: 'creative',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: (_, s) => s?.mode === 'direct' },
    },
    { name: 'link', type: 'text', admin: { condition: (_, s) => s?.mode === 'direct' } },
    {
      name: 'directStartsAt',
      label: 'Starts',
      type: 'date',
      admin: { condition: (_, s) => s?.mode === 'direct', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'directEndsAt',
      label: 'Ends',
      type: 'date',
      admin: { condition: (_, s) => s?.mode === 'direct', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'sponsor',
      type: 'text',
      admin: { condition: (_, s) => s?.mode === 'direct', description: 'Advertiser name, used for the "Advertisement" label and rel="sponsored".' },
    },
  ],
}
