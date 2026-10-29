import type { CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { anyone, isSuperAdmin, superAdminOnly } from '@/access/roles'
import { slugField } from '@/fields/slug'
import { queuePathRefresh } from '@/hooks/queuePathRefresh'
import { trackPreviousSlug } from '@/lib/articlePath'

/** URLs the site itself uses; a section can't take them. */
const RESERVED_SLUGS = ['admin', 'api', 'tag', 'tags', 'author', 'authors', 'search', 'media', 'sitemap', 'rss', 'feed', 'about', 'contact', 'privacy', 'cookies', 'terms', 'advertise', 'account', 'login', 'saved', 'latest', 'go', 'sitemaps', 'corrections', 'sentry-tunnel', 'healthz', 'editorial-standards', 'advertising-disclosure']

/**
 * Top-level desks such as World News and Explainers. New desks (Business, Sport...)
 * are added here without code changes; each gets /{slug}, its own categories and nav entry.
 */
export const Sections: CollectionConfig = {
  slug: 'sections',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'kind', 'showInNav', 'sortOrder'],
    group: 'Content',
    description: 'Top-level desks. Each becomes a page at /{slug} with its own categories.',
  },
  access: { read: anyone, create: superAdminOnly, update: superAdminOnly, delete: superAdminOnly },
  custom: { totp: { disableAccessWrapper: { read: true } } },
  defaultSort: 'sortOrder',
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req }) => {
        // Renaming a live desk's URL would orphan every article under it.
        if (originalDoc?.slug && data.slug && data.slug !== originalDoc.slug && !isSuperAdmin(req.user)) {
          throw new ValidationError({ errors: [{ path: 'slug', message: 'Only a Super Admin can change a section URL.' }] })
        }
        return trackPreviousSlug({ data, originalDoc })
      },
    ],
    afterChange: [queuePathRefresh('section')],
    beforeDelete: [
      async ({ id, req }) => {
        const [articles, categories] = await Promise.all([
          req.payload.count({ collection: 'articles', where: { section: { equals: id } }, req }),
          req.payload.count({ collection: 'categories', where: { section: { equals: id } }, req }),
        ])
        if (articles.totalDocs > 0 || categories.totalDocs > 0) {
          throw new ValidationError({
            errors: [
              {
                path: 'id',
                message: `This section still has ${articles.totalDocs} article(s) and ${categories.totalDocs} categor(ies). Move or delete them first.`,
              },
            ],
          })
        }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. "World News"' } },
    {
      ...slugField('name'),
      unique: true,
      validate: (value: unknown) =>
        typeof value === 'string' && RESERVED_SLUGS.includes(value)
          ? `"${value}" is reserved for another part of the site.`
          : true,
      admin: {
        position: 'sidebar',
        description: 'The URL, e.g. "news" → clarity60.com/news. Avoid changing it once articles are live.',
      },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'evergreen',
      options: [
        { label: 'News (time-sensitive; Google News sitemap, NewsArticle schema)', value: 'news' },
        { label: 'Evergreen (explainers, guides; Article schema)', value: 'evergreen' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'kicker', type: 'text', admin: { description: 'Small label above the title, e.g. "Section · The News Desk"' } },
    { name: 'description', type: 'textarea', maxLength: 300, admin: { description: 'e.g. "What happened today, where, and why it matters, in plain English."' } },
    {
      name: 'previousSlugs',
      type: 'text',
      hasMany: true,
      admin: { readOnly: true, position: 'sidebar', description: 'Old URL names; links using them redirect here.' },
    },
    { name: 'showInNav', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
