import { describe, expect, it } from 'vitest'

import { absolute, articleSchema, faqItems, faqSchema, imageObject, organization, SITE_URL, webPageSchema } from '@/lib/schema'
import type { Article, Media, Page } from '@/payload-types'

const media = (over: Partial<Media> = {}) =>
  ({ id: 1, alt: 'A', credit: 'Clarity60', license: 'own', url: '/api/media/file/a.jpg', width: 1200, height: 675, createdAt: '2026-10-30T00:00:00Z', updatedAt: '', ...over }) as Media

const faqBody = {
  root: {
    type: 'root',
    children: [
      { type: 'paragraph', children: [] },
      {
        type: 'block',
        fields: {
          blockType: 'faq',
          items: [
            { question: 'Why are flamingos pink?', answer: 'Because of what they eat.' },
            { question: 'Are chicks pink?', answer: 'No, they hatch grey.' },
          ],
        },
      },
    ],
  },
} as unknown as Article['body']

const article = (over: Partial<Article> = {}) =>
  ({ id: 1, title: 'Flamingos', summary: 'Why they are pink.', path: '/explainers/science/flamingos', body: faqBody, createdAt: '2026-10-30T00:00:00Z', updatedAt: '2026-10-30T00:00:00Z', ...over }) as Article

describe('structured data', () => {
  it('keeps full media URLs (ImageKit) instead of prefixing the site', () => {
    expect(absolute('https://ik.imagekit.io/c60/a.jpg')).toBe('https://ik.imagekit.io/c60/a.jpg')
    expect(absolute('/news')).toBe(`${SITE_URL}/news`)
  })

  it('takes socials and contact from Site Settings and links the trust policies', () => {
    const org = organization({
      socials: { instagram: 'https://www.instagram.com/theclarity60/', youtube: '', x: 'https://x.com/clarity60', facebook: null },
      contactEmail: 'hello@clarity60.com',
    })
    expect(org.sameAs).toEqual(['https://www.instagram.com/theclarity60/', 'https://x.com/clarity60'])
    expect(org.contactPoint?.email).toBe('hello@clarity60.com')
    expect(org.correctionsPolicy).toBe(`${SITE_URL}/corrections`)
  })

  it('describes image credit and licence from the Media fields', () => {
    expect(imageObject(media())).toMatchObject({ creditText: 'Clarity60', copyrightNotice: '© Clarity60', license: `${SITE_URL}/terms` })
    const canva = imageObject(media({ license: 'canva', credit: 'Canva' }))
    expect(canva).toMatchObject({ creditText: 'Canva' })
    expect(canva).not.toHaveProperty('license')
    expect(canva).not.toHaveProperty('copyrightNotice')
  })

  it('adds a VideoObject only when the hero video has a poster', () => {
    const video = media({ mimeType: 'video/mp4', url: '/api/media/file/v.mp4' })
    expect(articleSchema(article({ heroMedia: video }))).not.toHaveProperty('video')
    const withPoster = articleSchema(article({ heroMedia: { ...video, poster: media({ url: '/api/media/file/p.jpg' }) } }))
    expect(withPoster).toMatchObject({ video: { '@type': 'VideoObject', thumbnailUrl: [`${SITE_URL}/api/media/file/p.jpg`] } })
  })

  it('builds FAQPage from FAQ blocks, and can be switched off', () => {
    expect(faqItems(faqBody)).toHaveLength(2)
    const doc = { body: faqBody, path: '/explainers/science/flamingos' }
    expect(faqSchema(doc)?.mainEntity[0]).toMatchObject({ name: 'Why are flamingos pink?' })
    expect(faqSchema({ body: faqBody, path: '/about' })?.['@id']).toBe(`${SITE_URL}/about#faq`)
    expect(faqSchema(doc, { faqSchema: false })).toBeNull()
    expect(faqSchema({ body: { root: { type: 'root', children: [] } } as unknown as Article['body'], path: '/x' })).toBeNull()
  })

  it('types About and Contact pages', () => {
    expect(webPageSchema({ slug: 'about', title: 'About' } as Page)['@type']).toBe('AboutPage')
    expect(webPageSchema({ slug: 'privacy', title: 'Privacy' } as Page)['@type']).toBe('WebPage')
  })
})
