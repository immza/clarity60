import type { CollectionConfig } from 'payload'

import { ROLES, isSuperAdmin, staffOnly, superAdminField, superAdminOnly } from '@/access/roles'

/** Staff accounts (Super Admin / Editor / Writer). Readers live in Supabase Auth, never here. */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Admin',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    // The very first account is created through Payload's "create first user"
    // screen, which bypasses this; every later account is invited by a Super Admin.
    create: superAdminOnly,
    read: staffOnly,
    update: ({ req: { user } }) => (isSuperAdmin(user) ? true : user ? { id: { equals: user.id } } : false),
    delete: superAdminOnly,
    unlock: superAdminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
        if (totalDocs === 0) data.role = 'super-admin'
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'writer',
      saveToJWT: true,
      options: ROLES.map((value) => ({
        value,
        label: { 'super-admin': 'Super Admin', editor: 'Editor', writer: 'Writer' }[value],
      })),
      access: { create: superAdminField, update: superAdminField },
      admin: {
        position: 'sidebar',
        description: 'Writers draft and submit. Editors publish. Super Admins manage everything.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      admin: { position: 'sidebar', description: 'Public author profile used for bylines.' },
    },
  ],
}
