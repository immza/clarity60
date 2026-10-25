import type { CollectionConfig, Where } from 'payload'
import { Forbidden, ValidationError } from 'payload'

import { editorsOnly, isEditorOrAbove, isStaff, publishedOrStaff, roleOf, staffOnly } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { columnInchesFor, countWords, readingMinutesFor } from '@/lib/text'
import { SECTIONS } from './Categories'

const isNews = (data: Partial<{ section: string }> | undefined) => data?.section === 'news'

const idOf = (value: unknown): number | string | undefined =>
  value && typeof value === 'object' && 'id' in value ? (value as { id: number | string }).id : (value as number | string | undefined)

/** Builds /{section}/{category}[/{subcategory}]/{slug}. */
const buildPath = async (
  req: Parameters<NonNullable<NonNullable<CollectionConfig['hooks']>['beforeChange']>[number]>[0]['req'],
  section: string,
  categoryId: number | string,
  slug: string,
) => {
  const category = await req.payload.findByID({ collection: 'categories', id: categoryId, depth: 1, req })
  if (category.section !== section) {
    throw new ValidationError({ errors: [{ path: 'category', message: 'Category must belong to the article’s section.' }] })
  }
  const parent = category.parent && typeof category.parent === 'object' ? category.parent : null
  return ['', section, parent?.slug, category.slug, slug].filter((p) => p !== undefined && p !== null).join('/')
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'section', 'category', 'editorialStatus', '_status', 'publishedAt'],
    group: 'Content',
    listSearchableFields: ['title', 'summary', 'slug'],
    preview: (doc) => (typeof doc.path === 'string' ? `${process.env.NEXT_PUBLIC_SITE_URL}${doc.path}` : null),
  },
  versions: {
    drafts: { autosave: { interval: 2000 }, schedulePublish: { timeFormat: 'HH:mm' } },
    maxPerDoc: 50,
  },
  access: {
    read: publishedOrStaff,
    create: staffOnly,
    // Writers may only edit their own unpublished articles. Once live, only editors can
    // change or unpublish it. Publishing itself is also blocked in beforeChange.
    update: ({ req: { user } }) => {
      if (isEditorOrAbove(user)) return true
      if (isStaff(user) && user) {
        const ownUnpublished: Where = {
          and: [{ createdBy: { equals: user.id } }, { _status: { not_equals: 'published' } }],
        }
        return ownUnpublished
      }
      return false
    },
    delete: editorsOnly,
    readVersions: staffOnly,
  },
  custom: {
    totp: {
      // Public visitors read published articles without logging in; staff reads still pass the TOTP check.
      disableAccessWrapper: { read: true },
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        const user = req.user
        if (data._status === 'published' && user && roleOf(user) === 'writer') {
          throw new Forbidden(req.t)
        }
        if (operation === 'create' && user?.collection === 'users') {
          data.createdBy = user.id
        }

        const words = countWords(data.body ?? originalDoc?.body)
        data.wordCount = words
        data.columnInches = columnInchesFor(words)
        data.readingMinutes = readingMinutesFor(words)

        if (data._status === 'published' && !data.publishedAt && !originalDoc?.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }

        const section = data.section ?? originalDoc?.section
        const slug = data.slug ?? originalDoc?.slug
        const categoryId = idOf(data.category ?? originalDoc?.category)
        if (section && slug && categoryId) {
          const clash = await req.payload.find({
            collection: 'articles',
            depth: 0,
            limit: 1,
            draft: true,
            overrideAccess: true,
            req,
            where: {
              and: [
                { section: { equals: section } },
                { slug: { equals: slug } },
                ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
              ],
            },
          })
          if (clash.totalDocs > 0) {
            throw new ValidationError({
              errors: [{ path: 'slug', message: `Another ${section} article already uses this slug.` }],
            })
          }
          data.path = await buildPath(req, section, categoryId, slug)
        }

        // Redirects follow the last *published* URL, so autosaved drafts never create them.
        if (data._status === 'published' && data.path) {
          const previous = originalDoc?.publishedPath
          if (previous && previous !== data.path) req.context[`redirectFrom:${originalDoc.id}`] = previous
          data.publishedPath = data.path
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        // Keep old URLs alive: when a published article's URL changes, 301 the old path to it.
        const oldPath = req.context[`redirectFrom:${doc.id}`]
        if (typeof oldPath !== 'string' || doc._status !== 'published') return doc
        delete req.context[`redirectFrom:${doc.id}`]

        await req.payload.delete({
          collection: 'redirects',
          where: { from: { equals: doc.path } },
          overrideAccess: true,
          req,
        })
        await req.payload.create({
          collection: 'redirects',
          data: {
            from: oldPath,
            to: { type: 'reference', reference: { relationTo: 'articles', value: doc.id } },
            type: '301',
          },
          overrideAccess: true,
          req,
        })
        return doc
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Corrections cannot outlive their article (article_id is NOT NULL).
        await req.payload.delete({
          collection: 'corrections',
          where: { article: { equals: id } },
          overrideAccess: true,
          req,
        })
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 140 },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: { description: 'The one- or two-line standfirst under the headline. Also the default meta description.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Story',
          fields: [
            { name: 'heroMedia', type: 'upload', relationTo: 'media', admin: { description: 'Lead image or video.' } },
            { name: 'body', type: 'richText', required: true },
          ],
        },
        {
          label: 'News desk',
          admin: { condition: (data) => isNews(data) },
          fields: [
            {
              name: 'sources',
              type: 'array',
              admin: { description: 'Outlets and documents this story relies on. Shown as "Sources:" and helps AI engines trust and cite us.' },
              fields: [
                { name: 'outlet', type: 'text', required: true },
                { name: 'url', type: 'text' },
              ],
            },
            {
              name: 'developing',
              type: 'group',
              fields: [
                { name: 'isDeveloping', type: 'checkbox', label: 'This is a developing story' },
                {
                  name: 'updates',
                  type: 'array',
                  admin: { condition: (_, sibling) => Boolean(sibling?.isDeveloping), initCollapsed: false },
                  fields: [
                    { name: 'at', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' } } },
                    { name: 'text', type: 'textarea', required: true, maxLength: 400 },
                  ],
                },
              ],
            },
            { name: 'instagramUrl', type: 'text', admin: { description: 'Optional "Watch on IG" link.' } },
            {
              name: 'relatedExplainer',
              type: 'relationship',
              relationTo: 'articles',
              filterOptions: { section: { equals: 'explainers' } },
              admin: { description: '"Need the backstory?" link.' },
            },
          ],
        },
      ],
    },
    // Sidebar
    {
      name: 'section',
      type: 'select',
      required: true,
      options: [...SECTIONS],
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar', description: 'Region (news) or subject (explainers). Sets the URL.' },
      filterOptions: ({ data }) => (data?.section ? { section: { equals: data.section } } : true),
    },
    slugField('title'),
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'authors', type: 'relationship', relationTo: 'authors', hasMany: true, admin: { position: 'sidebar' } },
    {
      name: 'bylineOverride',
      type: 'text',
      admin: { position: 'sidebar', description: 'e.g. "By the Clarity60 Desk". Overrides the author names in the byline.' },
    },
    {
      name: 'editorialStatus',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready for review', value: 'in_review' },
      ],
      admin: { position: 'sidebar', description: 'Writers: set to "Ready for review" when done. Editors publish.' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'Set automatically on first publish.' },
    },
    { name: 'featured', type: 'checkbox', admin: { position: 'sidebar', description: 'Lead story / The Long Read slot.' } },
    { name: 'topStory', type: 'checkbox', admin: { position: 'sidebar', description: 'Top story on World News.' } },
    {
      type: 'collapsible',
      label: 'Computed',
      admin: { position: 'sidebar', initCollapsed: true },
      fields: [
        { name: 'path', type: 'text', index: true, unique: true, admin: { readOnly: true } },
        { name: 'publishedPath', type: 'text', admin: { readOnly: true, description: 'URL at last publish.' } },
        { name: 'wordCount', type: 'number', admin: { readOnly: true } },
        { name: 'columnInches', type: 'number', admin: { readOnly: true } },
        { name: 'readingMinutes', type: 'number', admin: { readOnly: true } },
        { name: 'createdBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true }, access: { update: () => false } },
      ],
    },
  ],
}
