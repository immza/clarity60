import { describe, expect, it } from 'vitest'

import { absolute } from '@/components/header/LastUpdated'

describe('LastUpdated time', () => {
  // The browser must produce exactly the server's text, or React rebuilds the page
  // (in Safari that also wiped the reader's Morning/Night Edition choice).
  it('reads the same in every browser', () => {
    expect(absolute(new Date('2026-11-08T14:05:00Z'), 'UTC')).toBe('8 Nov, 14:05 UTC')
    expect(absolute(new Date('2026-01-03T00:07:00Z'), 'UTC')).toBe('3 Jan, 00:07 UTC')
  })
})
