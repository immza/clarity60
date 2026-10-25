import type { CollectionConfig, Where } from 'payload'
import { ValidationError } from 'payload'

import { anyone, editorsOnly, superAdminOnly } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { queuePathRefresh } from '@/hooks/queuePathRefresh'
import { trackPreviousSlug } from '@/lib/articlePath'
import { idOf } from '@/lib/relations'

/**
 * Categories inside a section (news regions, explainer subjects...). Max two levels
 * (e.g. History → Ancient History). Slugs are unique among siblings, since they appear
 * in URLs: /news/asia/...
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'section', 'parent', 'slug'], group: 'Content' },
  access: { read: anyone, create: editorsOnly, update: editorsOnly, delete: superAdminOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  defaultSort: 'sortOrder',
  hooks: {
    beforeChange: [({ data, originalDoc }) => trackPreviousSlug({ data, originalDoc })],
    afterChange: [queuePathRefresh('category')],
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        const section = idOf(data.section ?? originalDoc?.section)
        const parentId = data.parent === undefined ? originalDoc?.parent : data.parent
        const id = originalDoc?.id

        if (parentId && id) {
          const children = await req.payload.count({
            collection: 'categories',
            where: { parent: { equals: id } },
            req,
          })
          if (children.totalDocs > 0) {
            throw new ValidationError({
              errors: [{ path: 'parent', message: 'This category has sub-categories, so it must stay top-level.' }],
            })
          }
        }

        if (parentId) {
          const parent = await req.payload.findByID({
            collection: 'categories',
            id: typeof parentId === 'object' ? parentId.id : parentId,
            depth: 0,
            req,
          })
          if (parent.parent) {
            throw new ValidationError({
              errors: [{ path: 'parent', message: 'Categories can only be two levels deep.' }],
            })
          }
          if (idOf(parent.section) !== section) {
            throw new ValidationError({
              errors: [{ path: 'parent', message: 'Parent must be in the same section.' }],
            })
          }
        }

        const slug = data.slug ?? originalDoc?.slug
        if (slug) {
          const clash = await req.payload.find({
            collection: 'categories',
            depth: 0,
            limit: 1,
            req,
            where: {
              and: [
                { section: { equals: section } },
                { slug: { equals: slug } },
                parentId
                  ? { parent: { equals: typeof parentId === 'object' ? parentId.id : parentId } }
                  : { parent: { exists: false } },
                ...(id ? [{ id: { not_equals: id } }] : []),
              ],
            },
          })
          if (clash.totalDocs > 0) {
            throw new ValidationError({
              errors: [{ path: 'slug', message: 'Another category here already uses this slug.' }],
            })
          }
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'section',
      type: 'relationship',
      relationTo: 'sections',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: { position: 'sidebar', description: 'Leave empty for a top-level category.' },
      filterOptions: ({ data, id }) => {
        const and: Where[] = [{ parent: { exists: false } }]
        if (data?.section) and.push({ section: { equals: idOf(data.section) } })
        if (id) and.push({ id: { not_equals: id } })
        return { and }
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'One line shown on the section page, e.g. "Borders, maps and strange places."' },
    },
    {
      name: 'previousSlugs',
      type: 'text',
      hasMany: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Old URL names; links using them redirect here.' },
    },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
