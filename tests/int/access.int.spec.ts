import { describe, expect, it } from 'vitest'

import { publishedOrStaff } from '@/access/roles'

/** Minimal access args with the TOTP plugin switched on, as in production. */
const args = (user: Record<string, unknown> | null) =>
  ({
    req: {
      user,
      payload: { config: { custom: { totp: { pluginOptions: { collection: 'users', forceSetup: true } } } } },
    },
  }) as never

const PUBLISHED_ONLY = { _status: { equals: 'published' } }

describe('2FA on staff reads', () => {
  it('a password-only staff session sees published content only', async () => {
    const user = { id: 1, collection: 'users', role: 'editor', hasTotp: true, _strategy: 'local-jwt' }
    expect(await publishedOrStaff(args(user))).toEqual(PUBLISHED_ONLY)
  })

  it('a staff member who has not set up 2FA sees published content only', async () => {
    const user = { id: 1, collection: 'users', role: 'writer', hasTotp: false, _strategy: 'local-jwt' }
    expect(await publishedOrStaff(args(user))).toEqual(PUBLISHED_ONLY)
  })

  it('a staff session verified with a 2FA code sees drafts', async () => {
    const user = { id: 1, collection: 'users', role: 'editor', hasTotp: true, _strategy: 'totp' }
    expect(await publishedOrStaff(args(user))).toBe(true)
  })

  it('anonymous visitors see published content only', async () => {
    expect(await publishedOrStaff(args(null))).toEqual(PUBLISHED_ONLY)
  })
})
