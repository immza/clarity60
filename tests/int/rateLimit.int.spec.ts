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

  it('uses the Cloudflare visitor header only when the request really came through Cloudflare', () => {
    const via = (peer: string, visitor = '8.8.4.4') =>
      clientIp(new Headers({ 'do-connecting-ip': peer, 'cf-connecting-ip': visitor }), 'do-connecting-ip')
    expect(via('172.70.1.2')).toBe('8.8.4.4')
    expect(via('2a06:98c7::1', '2001:db8::5')).toBe('2001:db8::5')
    expect(via('2606:4700:10::6816:1')).toBe('8.8.4.4')
    // Sent straight to the app: the claimed visitor IP is ignored.
    expect(via('203.0.113.9')).toBe('203.0.113.9')
    expect(via('2001:db8::1')).toBe('2001:db8::1')
    // Garbage in the visitor header falls back to the edge address.
    expect(via('172.70.1.2', 'not-an-ip')).toBe('172.70.1.2')
    expect(via('999.1.1.1')).toBe('999.1.1.1')
  })
})
