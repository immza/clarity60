import type { CollectionConfig } from 'payload'

import { anyone, editorsOnly, staffOnly } from '@/access/roles'
import { fileTypeFromBuffer } from 'file-type'

import { tidyUploadName } from '@/lib/text'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { defaultColumns: ['filename', 'alt', 'credit', 'license'], group: 'Content' },
  access: { read: anyone, create: staffOnly, update: staffOnly, delete: editorsOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  hooks: {
    // Before the file is stored: give it a clean, SEO-friendly name with the right extension.
    // The extension comes from the file's actual contents, not the type the browser claimed.
    beforeOperation: [
      async ({ args, operation }) => {
        const file = args.req?.file
        if ((operation === 'create' || operation === 'update') && file?.name) {
          const detected = file.data?.length ? await fileTypeFromBuffer(file.data) : undefined
          file.name = tidyUploadName(file.name, detected?.mime ?? file.mimetype)
        }
        return args
      },
    ],
  },
  upload: {
    // Local disk in development; Supabase Storage + ImageKit in production (see payload.config.ts).
    // MEDIA_DIR lets tests use a throwaway folder instead of the development one.
    staticDir: process.env.MEDIA_DIR || 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'video/webm'],
    adminThumbnail: 'thumbnail',
    imageSizes: [{ name: 'thumbnail', width: 400, height: 300, position: 'centre' }],
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for screen readers and Google Images.' },
    },
    { name: 'caption', type: 'text', admin: { description: 'Shown under the image, e.g. "The Ideal X leaves Port Newark, April 1956."' } },
    {
      name: 'credit',
      type: 'text',
      required: true,
      admin: { description: 'Who made it or where it came from, e.g. "Clarity60", "Canva", "Wikimedia Commons / John Doe".' },
    },
    {
      name: 'license',
      type: 'select',
      required: true,
      defaultValue: 'own',
      options: [
        { label: 'Our own work', value: 'own' },
        { label: 'Canva (licensed)', value: 'canva' },
        { label: 'Public domain', value: 'public-domain' },
        { label: 'Creative Commons', value: 'creative-commons' },
        { label: 'AI-generated', value: 'ai-generated' },
        { label: 'Licensed / other', value: 'licensed' },
      ],
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: { description: 'Link to the original, required for Creative Commons.' },
      validate: (value: unknown, { siblingData }: { siblingData: { license?: string } }) =>
        siblingData.license === 'creative-commons' && !value
          ? 'Creative Commons images need a source link.'
          : true,
    },
  ],
}
