import { describe, expect, it } from 'vitest'

import { clientIp, rateLimit } from '@/lib/rateLimit'

describe('rate limiter', () => {
  it('allows up to the limit, blocks after, and resets when the window ends', () => {
    const key = `t:${Math.random()}`
    const t0 = 1_000_000
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000, t0).allowed).toBe(true)
    const blocked = rateLimit(key, 3, 60_000, t0 + 1000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBe(59)
    expect(rateLimit(key, 3, 60_000, t0 + 60_001).allowed).toBe(true)
  })

  it('keys only by the platform-set header and ignores client-supplied forwarding headers', () => {
    expect(clientIp(new Headers({ 'do-connecting-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' }))).toBe('1.2.3.4')
    expect(clientIp(new Headers({ 'x-forwarded-for': '5.6.7.8', 'cf-connecting-ip': '6.6.6.6' }))).toBe('unknown')
    expect(clientIp(new Headers({ 'cf-connecting-ip': '7.7.7.7' }), 'cf-connecting-ip')).toBe('7.7.7.7')
  })
})
