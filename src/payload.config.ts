import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import type { CollectionConfig } from 'payload'
import { buildConfig } from 'payload'
import { payloadTotp, totpAccess } from 'payload-totp'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { editorsOnly, isEditorOrAbove } from './access/roles'
import { AdSlots } from './collections/AdSlots'
import { AffiliateLinks } from './collections/AffiliateLinks'
import { Articles } from './collections/Articles'
import { AuditLog } from './collections/AuditLog'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Corrections } from './collections/Corrections'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Promotions } from './collections/Promotions'
import { Sections } from './collections/Sections'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { editor } from './editor'
import { SiteSettings } from './globals/SiteSettings'
import { auditAfterChange, auditAfterDelete } from './hooks/auditLog'
import { revalidateAfterChange, revalidateAfterDelete, revalidateGlobal } from './hooks/revalidate'
import { refreshArticlePaths } from './jobs/refreshArticlePaths'
import { TAGS } from './lib/cacheTags'
import { databaseTls } from './lib/databaseTls'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

const databaseUrl = process.env.DATABASE_URL || ''

// Production media storage is all-or-nothing: a half-configured setup would store files
// that can't be served (or fail every upload), so refuse to boot instead.
const STORAGE_VARS = ['S3_BUCKET', 'S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'IMAGEKIT_URL_ENDPOINT']
const storageEnabled = Boolean(process.env.S3_BUCKET)
if (storageEnabled) {
  const missing = STORAGE_VARS.filter((key) => !process.env[key])
  if (missing.length) throw new Error(`Media storage is enabled (S3_BUCKET is set) but missing: ${missing.join(', ')}`)
}

/** Public cache tags each collection's changes should clear. */
const CACHE_TAGS: Partial<Record<string, string[]>> = {
  articles: [TAGS.articles],
  sections: [TAGS.sections, TAGS.articles],
  categories: [TAGS.categories, TAGS.articles],
  authors: [TAGS.articles],
  media: [TAGS.articles],
  corrections: [TAGS.articles],
  'ad-slots': [TAGS.settings],
  promotions: [TAGS.settings],
  pages: [TAGS.pages],
  tags: [TAGS.articles],
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
  collections: [Articles, Sections, Categories, Tags, Authors, Media, Pages, Corrections, AdSlots, Promotions, AffiliateLinks, Users, AuditLog].map(
    withHooks,
  ),
  globals: [{ ...SiteSettings, hooks: { afterChange: [revalidateGlobal(TAGS.settings)] } }],
  editor,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: databaseUrl, ...databaseTls(databaseUrl, process.env.DATABASE_CA_CERT) },
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
    // Production media: Supabase Storage (S3 API) as the store, ImageKit in front for delivery.
    // Off unless S3_BUCKET is set, so local development keeps using ./media.
    s3Storage({
      enabled: storageEnabled,
      // Same media columns whether or not storage is on, so one migration fits every environment.
      alwaysInsertFields: true,
      bucket: process.env.S3_BUCKET || '',
      collections: {
        media: {
          prefix: 'media',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${(process.env.IMAGEKIT_URL_ENDPOINT || '').replace(/\/$/, '')}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
      },
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'us-west-2',
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
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
        hooks: {
          afterChange: [auditAfterChange, revalidateAfterChange(TAGS.articles)],
          afterDelete: [auditAfterDelete, revalidateAfterDelete(TAGS.articles)],
        },
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
