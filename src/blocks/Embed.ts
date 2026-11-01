import type { Block } from 'payload'

import { parseEmbed, SUPPORTED_EMBEDS } from '@/lib/embeds'

/**
 * A social post shown inside an article. It plays from the original account, so the
 * footage is shown without copying it. Readers see a card first and load the post with
 * one tap, which keeps the page fast and the platform's trackers off until they choose.
 */
export const EmbedBlock: Block = {
  slug: 'embed',
  labels: { singular: 'Embed post (X, Instagram, YouTube, TikTok)', plural: 'Embedded posts' },
  interfaceName: 'EmbedBlock',
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Post link',
      admin: { description: `Paste the link to one post on ${SUPPORTED_EMBEDS}.` },
      validate: (value: unknown) =>
        typeof value === 'string' && parseEmbed(value)
          ? true
          : `Paste the full link to a single post on ${SUPPORTED_EMBEDS}. For TikTok, open the video and copy the link from the address bar (short vm.tiktok.com links can't be embedded).`,
    },
    {
      name: 'caption',
      type: 'text',
      maxLength: 200,
      admin: {
        description:
          'One line on what the post shows, e.g. "CCTV footage shared by the restaurant." Shown on the card, and read by Google and AI search, which can’t see inside embeds.',
      },
    },
  ],
}
