import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

type Action = 'create' | 'update' | 'publish' | 'delete'

const titleOf = (doc: Record<string, unknown>): string =>
  String(doc.title ?? doc.name ?? doc.email ?? doc.key ?? doc.from ?? doc.id ?? '').slice(0, 200)

const record = async (
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  collection: string,
  doc: Record<string, unknown>,
  action: Action,
) => {
  await req.payload.create({
    collection: 'audit-log',
    data: {
      action,
      collectionSlug: collection,
      docId: String(doc.id),
      docTitle: titleOf(doc),
      user: req.user && req.user.collection === 'users' ? req.user.id : undefined,
    },
    overrideAccess: true,
    req,
  })
}

export const auditAfterChange: CollectionAfterChangeHook = async ({
  collection,
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Autosave fires every couple of seconds while someone types; only deliberate saves are logged.
  if (req.query?.autosave === 'true' || req.query?.autosave === true) return doc

  // Saving a draft over a published doc is not an unpublish, so only the
  // transition into "published" is singled out.
  const published = doc._status === 'published' && previousDoc?._status !== 'published'
  const action: Action = published ? 'publish' : operation

  await record(req, collection.slug, doc, action)
  return doc
}

export const auditAfterDelete: CollectionAfterDeleteHook = async ({ collection, doc, req }) => {
  await record(req, collection.slug, doc, 'delete')
  return doc
}
