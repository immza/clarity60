import type { Block } from 'payload'

/**
 * "Questions answered" section inside an article. Optional: it exists only where an
 * editor adds it. Its questions also become FAQPage structured data, unless that is
 * switched off in Site Settings.
 */
export const FaqBlock: Block = {
  slug: 'faq',
  labels: { singular: 'FAQ (questions answered)', plural: 'FAQs' },
  interfaceName: 'FaqBlock',
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Questions answered', maxLength: 60 },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 10,
      labels: { singular: 'Question', plural: 'Questions' },
      admin: { description: 'Questions people actually search for. Start each answer with the direct answer.' },
      fields: [
        { name: 'question', type: 'text', required: true, maxLength: 160 },
        { name: 'answer', type: 'textarea', required: true, maxLength: 1000 },
      ],
    },
  ],
}
