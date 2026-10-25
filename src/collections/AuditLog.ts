import type { CollectionConfig } from 'payload'

import { superAdminOnly } from '@/access/roles'

/** Append-only record of who changed what. Written by hooks with overrideAccess. */
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  admin: {
    useAsTitle: 'docTitle',
    defaultColumns: ['createdAt', 'user', 'action', 'collectionSlug', 'docTitle'],
    group: 'Admin',
  },
  defaultSort: '-createdAt',
  access: {
    read: superAdminOnly,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: ['create', 'update', 'publish', 'delete'].map((value) => ({ label: value, value })),
    },
    { name: 'collectionSlug', type: 'text', required: true, index: true },
    { name: 'docId', type: 'text', required: true, index: true },
    { name: 'docTitle', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
  ],
}
