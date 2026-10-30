import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
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

describe('promotion styles', () => {
  const promo = (style: 'notice' | 'card' | 'wide' | 'video') =>
    payload.create({
      collection: 'promotions',
      data: { title: `Style ${style}`, headline: 'Read the paper', link: '/about', style },
      overrideAccess: true,
    })

  it('defaults to the quiet notice style, which needs no image', async () => {
    const created = await payload.create({
      collection: 'promotions',
      // No style given, to check the default; the generated type marks it required.
      data: { title: 'Default style', headline: 'Read the paper', link: '/about' } as Promotion,
      overrideAccess: true,
    })
    expect(created.style).toBe('notice')
  })

  it('card and banner need an image, and video needs a clip', async () => {
    await expect(promo('wide')).rejects.toThrow(/image/i)
    await expect(promo('card')).rejects.toThrow(/image/i)
    await expect(promo('video')).rejects.toThrow(/video/i)
  })

  it('an image cannot be used as the video, and a wide promo accepts its image', async () => {
    const data = await sharp({ create: { width: 16, height: 9, channels: 3, background: '#cccccc' } }).png().toBuffer()
    const image = await payload.create({
      collection: 'media',
      data: { alt: 'Promo image', credit: 'Clarity60', license: 'own' },
      file: { data, mimetype: 'image/png', name: 'promo-style-test.png', size: data.length },
      overrideAccess: true,
    })
    try {
      const base = { title: 'Media check', headline: 'Read the paper', link: '/about' }
      await expect(
        payload.create({ collection: 'promotions', data: { ...base, style: 'video', video: image.id }, overrideAccess: true }),
      ).rejects.toThrow()
      const wide = await payload.create({
        collection: 'promotions',
        data: { ...base, style: 'wide', image: image.id },
        overrideAccess: true,
      })
      await payload.delete({ collection: 'promotions', id: wide.id, overrideAccess: true })
    } finally {
      await payload.delete({ collection: 'media', id: image.id, overrideAccess: true })
    }
  })
})
