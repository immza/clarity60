import { describe, expect, it } from 'vitest'

import { consentDefaultsScript, consentUpdate } from '@/components/consent/consent'

describe('consent', () => {
  it('accept grants everything, essential-only denies everything', () => {
    expect(consentUpdate(true)).toMatchObject({ analytics_storage: 'granted', ad_personalization: 'granted' })
    expect(consentUpdate(false)).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied', ad_personalization: 'denied' })
  })

  it('Global Privacy Control keeps ad personalisation and sharing off even after "Accept all"', () => {
    const update = consentUpdate(true, true)
    expect(update.ad_personalization).toBe('denied')
    expect(update.ad_user_data).toBe('denied')
    expect(update.analytics_storage).toBe('granted')
  })

  it('the head script applies GPC before any Google tag runs', () => {
    expect(consentDefaultsScript).toContain('navigator.globalPrivacyControl===true')
  })
})
