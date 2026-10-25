import type { Access, FieldAccess, PayloadRequest } from 'payload'
import { totpAccess } from 'payload-totp'

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

/**
 * Staff who have completed 2FA this session. Collections whose public reads bypass the
 * TOTP wrapper use this for their staff-only branch, so a password alone is never enough.
 */
export const isVerifiedStaff = async (args: Parameters<Access>[0]) =>
  isStaff(args.req.user) && (await totpAccess(() => true)(args)) === true

/** Public sees published docs only; verified staff see drafts too. */
export const publishedOrStaff: Access = async (args) =>
  (await isVerifiedStaff(args)) ? true : { _status: { equals: 'published' } }

/** Field-level read for internal-only fields on publicly readable collections. */
export const verifiedStaffField: FieldAccess = async (args) =>
  isStaff(args.req.user) && (await totpAccess(() => true)(args as unknown as Parameters<Access>[0])) === true
