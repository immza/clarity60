import { BlocksFeature, LinkFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { FaqBlock } from './blocks/Faq'
import { ProductBlock } from './blocks/Product'

/**
 * The rich-text editor used for articles and pages: Payload's defaults, plus
 * - links that can point at articles, pages or Affiliate Links, with a "sponsored" flag
 * - the "Recommended product" block for affiliate content
 * - the optional "FAQ" block (questions answered), which also feeds FAQPage structured data
 */
export const editor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((f) => f.key !== 'link'),
    LinkFeature({
      enabledCollections: ['articles', 'pages', 'affiliate-links'],
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'sponsored',
          type: 'checkbox',
          label: 'Affiliate / sponsored link',
          admin: { description: 'Tick for any paid or commission link. Adds the disclosure and rel="sponsored".' },
        },
      ],
    }),
    BlocksFeature({ blocks: [ProductBlock, FaqBlock] }),
  ],
})
