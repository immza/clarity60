import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { pickPromotion, withinDates } from '@/lib/promotions'
import { hasAffiliateContent } from '@/lib/text'
import config from '@/payload.config'
import type { Promotion } from '@/payload-types'

let payload: Payload

const root = (...children: unknown[]) => ({ root: { type: 'root', children } })
const linkNode = (fields: Record<string, unknown>) => ({ type: 'link', fields, children: [{ type: 'text', text: 'x' }] })

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

describe('affiliate detection', () => {
  it('flags affiliate links, sponsored links and product blocks, but not ordinary links', () => {
    expect(hasAffiliateContent(root({ type: 'paragraph', children: [linkNode({ linkType: 'custom', url: 'https://x' })] }))).toBe(false)
    expect(
      hasAffiliateContent(
        root({ type: 'paragraph', children: [linkNode({ linkType: 'internal', doc: { relationTo: 'affiliate-links', value: 1 } })] }),
      ),
    ).toBe(true)
    expect(hasAffiliateContent(root({ type: 'paragraph', children: [linkNode({ linkType: 'custom', sponsored: true })] }))).toBe(true)
    expect(hasAffiliateContent(root({ type: 'block', fields: { blockType: 'product' } }))).toBe(true)
  })
})

describe('house promotions', () => {
  const promo = (id: number, extra: Partial<Promotion> = {}) =>
    ({ id, title: `p${id}`, headline: 'h', link: '/', weight: 1, slots: [], sections: [], categories: [], ...extra }) as Promotion

  it('only picks promotions targeted at this slot, section and category', () => {
    const promos = [
      promo(1, { slots: [9] }),
      promo(2, { sections: [5] }),
      promo(3, { categories: [7] }),
    ]
    expect(pickPromotion(promos, 1, { sectionId: 4, categoryIds: [8] })).toBeNull()
    expect(pickPromotion(promos, 9, { sectionId: 4, categoryIds: [8] })?.id).toBe(1)
    expect(pickPromotion(promos, 1, { sectionId: 5, categoryIds: [8] })?.id).toBe(2)
    expect(pickPromotion(promos, 1, { sectionId: 4, categoryIds: [7] })?.id).toBe(3)
  })

  it('respects start and end dates', () => {
    const hour = 3_600_000
    expect(withinDates(new Date(Date.now() - hour).toISOString(), new Date(Date.now() + hour).toISOString())).toBe(true)
    expect(withinDates(new Date(Date.now() + hour).toISOString(), null)).toBe(false)
    expect(withinDates(null, new Date(Date.now() - hour).toISOString())).toBe(false)
  })
})

describe('affiliate links', () => {
  it('are readable by the public site without exposing notes or click counts', async () => {
    const created = await payload.create({
      collection: 'affiliate-links',
      data: { name: 'Test Telescope', slug: '', url: 'https://example.com/tele?tag=c60', notes: 'secret', clicks: 5 },
      overrideAccess: true,
    })
    const pub = await payload.findByID({ collection: 'affiliate-links', id: created.id, overrideAccess: false })
    expect(pub.slug).toBe('test-telescope')
    expect(pub.notes).toBeUndefined()
    expect(pub.clicks).toBeUndefined()
  })

  it('rejects non-https partner URLs', async () => {
    await expect(
      payload.create({
        collection: 'affiliate-links',
        data: { name: 'Bad', slug: '', url: 'http://example.com' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
})
