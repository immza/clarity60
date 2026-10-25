import type { Block } from 'payload'

/** "Recommended" card inside an article: one product, one reason, one button. */
export const ProductBlock: Block = {
  slug: 'product',
  labels: { singular: 'Recommended product', plural: 'Recommended products' },
  interfaceName: 'ProductBlock',
  fields: [
    {
      name: 'affiliateLink',
      type: 'relationship',
      relationTo: 'affiliate-links',
      required: true,
      admin: { description: 'Create it first under Revenue → Affiliate Links.' },
    },
    { name: 'title', type: 'text', required: true, maxLength: 80 },
    { name: 'reason', type: 'textarea', maxLength: 200, admin: { description: 'One honest line on why it is worth it.' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'ctaLabel', type: 'text', defaultValue: 'See price', maxLength: 24 },
  ],
}
