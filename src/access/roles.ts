import type { Access, FieldAccess, PayloadRequest } from 'payload'

export const ROLES = ['super-admin', 'editor', 'writer'] as const
export type Role = (typeof ROLES)[number]

type MaybeUser = PayloadRequest['user']

export const roleOf = (user: MaybeUser): Role | null =>
  user && 'role' in user && ROLES.includes(user.role as Role) ? (user.role as Role) : null

export const isSuperAdmin = (user: MaybeUser) => roleOf(user) === 'super-admin'
export const isEditorOrAbove = (user: MaybeUser) => {
  const role = roleOf(user)
  return role === 'super-admin' || role === 'editor'
}
export const isStaff = (user: MaybeUser) => roleOf(user) !== null

export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user)
export const editorsOnly: Access = ({ req: { user } }) => isEditorOrAbove(user)
export const staffOnly: Access = ({ req: { user } }) => isStaff(user)
export const anyone: Access = () => true

export const superAdminField: FieldAccess = ({ req: { user } }) => isSuperAdmin(user)

/** Public sees published docs only; staff see drafts too. */
export const publishedOrStaff: Access = ({ req: { user } }) =>
  isStaff(user) ? true : { _status: { equals: 'published' } }
