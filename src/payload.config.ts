import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import type { CollectionConfig } from 'payload'
import { buildConfig } from 'payload'
import { payloadTotp, totpAccess } from 'payload-totp'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { editorsOnly, isEditorOrAbove } from './access/roles'
import { AdSlots } from './collections/AdSlots'
import { Articles } from './collections/Articles'
import { AuditLog } from './collections/AuditLog'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Corrections } from './collections/Corrections'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Sections } from './collections/Sections'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { auditAfterChange, auditAfterDelete } from './hooks/auditLog'
import { revalidateAfterChange, revalidateAfterDelete, revalidateGlobal } from './hooks/revalidate'
import { refreshArticlePaths } from './jobs/refreshArticlePaths'
import { TAGS } from './lib/cacheTags'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/** Public cache tags each collection's changes should clear. */
const CACHE_TAGS: Partial<Record<string, string[]>> = {
  articles: [TAGS.articles],
  sections: [TAGS.sections, TAGS.articles],
  categories: [TAGS.categories, TAGS.articles],
  authors: [TAGS.articles],
  media: [TAGS.articles],
  corrections: [TAGS.articles],
  'ad-slots': [TAGS.settings],
}

/** Adds audit logging (every collection but the log itself) and public cache clearing. */
const withHooks = (collection: CollectionConfig): CollectionConfig => {
  if (collection.slug === 'audit-log') return collection
  const tags = CACHE_TAGS[collection.slug] ?? []
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      afterChange: [
        ...(collection.hooks?.afterChange ?? []),
        auditAfterChange,
        ...tags.map(revalidateAfterChange),
      ],
      afterDelete: [
        ...(collection.hooks?.afterDelete ?? []),
        auditAfterDelete,
        ...tags.map(revalidateAfterDelete),
      ],
    },
  }
}

export default buildConfig({
  serverURL: siteUrl,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · Clarity60 Admin' },
    importMap: { baseDir: path.resolve(dirname) },
  },
  routes: {
    // Kept out of the public repo's defaults; set PAYLOAD_ADMIN_ROUTE in production.
    admin: (process.env.PAYLOAD_ADMIN_ROUTE as `/${string}` | undefined) || '/admin',
  },
  collections: [Articles, Sections, Categories, Tags, Authors, Media, Pages, Corrections, AdSlots, Users, AuditLog].map(
    withHooks,
  ),
  globals: [{ ...SiteSettings, hooks: { afterChange: [revalidateGlobal(TAGS.settings)] } }],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Local dev syncs the schema directly; production applies committed migrations on boot.
    push: process.env.NODE_ENV !== 'production',
    prodMigrations: migrations,
  }),
  sharp,
  graphQL: { disable: true },
  cors: [siteUrl],
  csrf: [siteUrl],
  jobs: {
    tasks: [refreshArticlePaths],
    access: {
      // Only editors and above may queue jobs (this covers scheduled publishing).
      queue: async (args) => (await totpAccess(editorsOnly)(args)) === true,
      cancel: async (args) => (await totpAccess(editorsOnly)(args)) === true,
      run: async (args) =>
        (Boolean(process.env.CRON_SECRET) &&
          args.req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`) ||
        isEditorOrAbove(args.req.user),
    },
    // The app runs on an always-on server, so the built-in runner handles scheduled publishes.
    autoRun: [{ cron: '* * * * *', queue: 'default' }],
    shouldAutoRun: () => process.env.DISABLE_JOBS !== 'true',
  },
  plugins: [
    seoPlugin({
      collections: ['articles', 'pages'],
      uploadsCollection: 'media',
      tabbedUI: false,
      generateTitle: ({ doc }) => (doc?.title ? `${doc.title} · Clarity60` : 'Clarity60'),
      generateDescription: ({ doc }) => doc?.summary ?? '',
      generateImage: ({ doc }) => doc?.heroMedia ?? null,
      generateURL: ({ doc }) => (doc?.path ? `${siteUrl}${doc.path}` : siteUrl),
    }),
    redirectsPlugin({
      collections: ['articles', 'pages'],
      redirectTypes: ['301', '302'],
      overrides: {
        admin: { group: 'Admin' },
        access: { read: editorsOnly, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
        hooks: { afterChange: [auditAfterChange], afterDelete: [auditAfterDelete] },
      },
    }),
    // Must stay last: it wraps every collection's access with the TOTP check.
    payloadTotp({
      collection: 'users',
      forceSetup: true,
      disabled: process.env.PAYLOAD_DISABLE_TOTP === 'true',
      totp: { issuer: 'Clarity60' },
      forceWhiteBackgroundOnQrCode: true,
    }),
  ],
})
