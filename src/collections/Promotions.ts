import type { CollectionConfig, UploadFieldSingleValidation } from 'payload'
import { upload } from 'payload/shared'

import { anyone, editorsOnly } from '@/access/roles'

/** Required only for one style; Payload's own upload check (incl. the image/video filter) still runs. */
const requiredForStyle =
  (style: string, message: string): UploadFieldSingleValidation =>
  (value, options) =>
    (options.siblingData as { style?: string } | undefined)?.style === style && !value ? message : upload(value, options)

/**
 * House promotions: small notices that fill an ad slot when no paid ad is running
 * (Instagram, newsletter, "Advertise with us", your own products). Each can be
 * scheduled and targeted to sections or categories.
 */
export const Promotions: CollectionConfig = {
  slug: 'promotions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'startsAt', 'endsAt', 'weight'],
    group: 'Revenue',
    description: 'Shown in ad slots set to "House promotions", and as the fallback for other modes.',
  },
  access: { read: anyone, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Internal name.' } },
    {
      name: 'label',
      type: 'text',
      defaultValue: 'From Clarity60',
      admin: { description: 'Small line above the headline. Use "Partner" or "Sponsored" if someone paid.' },
    },
    { name: 'headline', type: 'text', required: true, maxLength: 80 },
    { name: 'text', type: 'textarea', maxLength: 180 },
    { name: 'ctaLabel', type: 'text', defaultValue: 'Learn more', maxLength: 30 },
    {
      name: 'link',
      type: 'text',
      required: true,
      admin: { description: 'A page on this site (/advertise) or a full https:// link.' },
      validate: (value: unknown) => {
        const v = String(value ?? '')
        if (/^\/(?!\/)/.test(v)) return true
        try {
          return new URL(v).protocol === 'https:' ? true : 'Use https:// or a path starting with /'
        } catch {
          return 'Use a path starting with / or a full https:// link.'
        }
      },
    },
    {
      name: 'style',
      type: 'select',
      required: true,
      defaultValue: 'notice',
      options: [
        { label: 'Notice: text with a small square thumbnail (quiet)', value: 'notice' },
        { label: 'Wide: full-width image in its own shape', value: 'wide' },
        { label: 'Video: short silent looping clip', value: 'video' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { like: 'image/' } },
      admin: {
        description: 'Notice: optional, cropped to a small square. Wide: required, shown whole at full width (images taller than a square are trimmed to a square). Video: optional still shown before the clip plays.',
      },
      validate: requiredForStyle('wide', 'The Wide style needs an image.'),
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { like: 'video/' } },
      admin: {
        condition: (_, s) => s?.style === 'video',
        description: 'MP4 or WebM, ideally under 10 seconds and 5 MB. It plays muted on a loop, and only while on screen.',
      },
      validate: requiredForStyle('video', 'The Video style needs a video.'),
    },
    {
      type: 'collapsible',
      label: 'Where and when',
      fields: [
        { name: 'active', type: 'checkbox', defaultValue: true },
        {
          name: 'slots',
          type: 'relationship',
          relationTo: 'ad-slots',
          hasMany: true,
          admin: { description: 'Leave empty to allow every slot.' },
        },
        {
          name: 'sections',
          type: 'relationship',
          relationTo: 'sections',
          hasMany: true,
          admin: { description: 'Leave empty for every section.' },
        },
        {
          name: 'categories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: { description: 'Leave empty for every category.' },
        },
        { name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
        {
          name: 'weight',
          type: 'number',
          defaultValue: 1,
          min: 1,
          max: 10,
          admin: { description: 'When several promos match, higher weight shows more often.' },
        },
      ],
    },
  ],
}
