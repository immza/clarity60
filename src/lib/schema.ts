import type { Article, Author, Category, FaqBlock, Media, Page, Section, SiteSetting, Tag } from '@/payload-types'

/** Absolute site origin for canonical URLs and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
/** Absolute URL for a site path. Full URLs (e.g. media on ImageKit) pass through unchanged. */
export const absolute = (path: string) =>
  /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

const obj = <T,>(v: T | number | null | undefined): T | null => (v && typeof v === 'object' ? v : null)

/** The Site Settings the publisher schema reads. Optional so callers without settings still work. */
export type SchemaSettings = Partial<Pick<SiteSetting, 'socials' | 'contactEmail' | 'faqSchema'>>

const FALLBACK_SOCIALS = ['https://www.instagram.com/theclarity60/']

/**
 * The publisher. Social profiles and the contact address come from Site Settings; the
 * policy links are the trust signals Google News looks for (pages under Admin → Pages).
 */
export const organization = (settings?: SchemaSettings | null) => {
  const socials = settings
    ? Object.values(settings.socials ?? {}).filter((v): v is string => typeof v === 'string' && /^https:\/\//.test(v))
    : FALLBACK_SOCIALS
  const email = settings?.contactEmail
  return {
    '@type': 'NewsMediaOrganization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Clarity60',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: absolute('/logo.png'), width: 512, height: 512 },
    ...(socials.length ? { sameAs: socials } : {}),
    ...(email
      ? { email, contactPoint: { '@type': 'ContactPoint', contactType: 'editorial', email, url: absolute('/contact') } }
      : {}),
    publishingPrinciples: absolute('/editorial-standards'),
    ethicsPolicy: absolute('/editorial-standards'),
    correctionsPolicy: absolute('/corrections'),
    actionableFeedbackPolicy: absolute('/contact'),
  }
}

/**
 * An image with its credit and licence (from the Media fields), so Google Images can
 * show who made it and, for our own work, the "Licensable" badge.
 */
export const imageObject = (media: Media) => {
  const license =
    media.license === 'own'
      ? { license: absolute('/terms'), acquireLicensePage: absolute('/contact') }
      : media.license === 'public-domain'
        ? { license: 'https://creativecommons.org/publicdomain/mark/1.0/' }
        : media.license === 'creative-commons' && media.sourceUrl
          ? { acquireLicensePage: media.sourceUrl }
          : {}
  return {
    '@type': 'ImageObject',
    url: absolute(media.url!),
    ...(media.width && media.height ? { width: media.width, height: media.height } : {}),
    ...(media.caption ? { caption: media.caption } : {}),
    ...(media.credit ? { creditText: media.credit } : {}),
    // Only our own work carries our copyright; a credit like "Canva" is not a copyright holder.
    ...(media.license === 'own' ? { copyrightNotice: '© Clarity60' } : {}),
    ...license,
  }
}

/** A hero video. Google only lists videos that have a thumbnail, so it needs a poster image. */
export const videoObject = (media: Media, article: Pick<Article, 'title' | 'summary'>) => {
  const poster = obj<Media>(media.poster)
  if (!media.url || !poster?.url) return null
  return {
    '@type': 'VideoObject',
    name: article.title,
    description: article.summary,
    thumbnailUrl: [absolute(poster.url)],
    uploadDate: media.createdAt,
    contentUrl: absolute(media.url),
    ...(media.width && media.height ? { width: media.width, height: media.height } : {}),
  }
}

export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Clarity60',
  url: SITE_URL,
  description: 'World news and explainers in plain English. The world, explained.',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
})

export const breadcrumbSchema = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absolute(item.path),
  })),
})

export const personSchema = (author: Author) => ({
  '@type': 'Person',
  name: author.name,
  url: absolute(`/author/${author.slug}`),
  ...(author.jobTitle ? { jobTitle: author.jobTitle } : {}),
  ...(author.socials?.length ? { sameAs: author.socials.map((s) => s.url) } : {}),
})

/**
 * NewsArticle for news desks, Article for evergreen ones. Sources become `citation`,
 * which helps AI engines verify and cite the piece.
 */
export const articleSchema = (article: Article, settings?: SchemaSettings | null) => {
  const section = obj<Section>(article.section)
  const category = obj<Category>(article.category)
  const hero = obj<Media>(article.heroMedia)
  const authors = (article.authors ?? []).map((a) => obj<Author>(a)).filter((a): a is Author => Boolean(a))
  const tags = (article.tags ?? []).map((t) => obj<Tag>(t)?.name).filter(Boolean)
  const url = absolute(article.path ?? '/')
  const isVideo = Boolean(hero?.mimeType?.startsWith('video/'))
  const still = isVideo ? obj<Media>(hero?.poster) : hero
  const video = isVideo && hero ? videoObject(hero, article) : null
  const publisher = organization(settings)

  return {
    '@context': 'https://schema.org',
    // Paid content is declared as such, never as journalism.
    '@type': article.sponsorship?.isSponsored
      ? 'AdvertiserContentArticle'
      : section?.kind === 'news'
        ? 'NewsArticle'
        : 'Article',
    '@id': `${url}#article`,
    headline: article.title.slice(0, 110),
    description: article.meta?.description || article.summary,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(still?.url ? { image: [imageObject(still)] } : {}),
    ...(video ? { video } : {}),
    datePublished: article.publishedAt ?? article.createdAt,
    dateModified: article.updatedAt,
    author: authors.length ? authors.map(personSchema) : [publisher],
    publisher,
    isAccessibleForFree: true,
    inLanguage: 'en',
    ...(section ? { articleSection: category ? [section.name, category.name] : section.name } : {}),
    ...(tags.length ? { keywords: tags.join(', ') } : {}),
    ...(article.wordCount ? { wordCount: article.wordCount } : {}),
    ...(article.sources?.length
      ? {
          citation: article.sources.map((s) =>
            s.url ? { '@type': 'CreativeWork', name: s.outlet, url: s.url } : { '@type': 'CreativeWork', name: s.outlet },
          ),
        }
      : {}),
  }
}

type LexicalNode = { type?: string; fields?: { blockType?: string } & Partial<FaqBlock>; children?: LexicalNode[] }

/** Every question in an article's FAQ blocks, in reading order. */
export const faqItems = (body: Article['body'] | null | undefined) => {
  const items: { question: string; answer: string }[] = []
  const walk = (nodes: LexicalNode[] = []) => {
    for (const node of nodes) {
      if (node.type === 'block' && node.fields?.blockType === 'faq') {
        for (const i of node.fields.items ?? []) if (i.question && i.answer) items.push({ question: i.question, answer: i.answer })
      }
      walk(node.children)
    }
  }
  walk((body?.root?.children ?? []) as LexicalNode[])
  return items
}

/**
 * FAQPage for the FAQ blocks in an article or page body, or null if there are none or
 * it is switched off in Site Settings.
 */
export const faqSchema = (doc: { body?: Article['body'] | null; path: string }, settings?: SchemaSettings | null) => {
  if (settings?.faqSchema === false) return null
  const items = faqItems(doc.body)
  if (!items.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absolute(doc.path)}#faq`,
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
  }
}

/** About and Contact are typed as such; other pages (Privacy, Terms...) are plain WebPages. */
export const webPageSchema = (page: Page) => ({
  '@context': 'https://schema.org',
  '@type': page.slug === 'about' ? 'AboutPage' : page.slug === 'contact' ? 'ContactPage' : 'WebPage',
  '@id': `${absolute(`/${page.slug}`)}#webpage`,
  name: page.title,
  url: absolute(`/${page.slug}`),
  ...(page.meta?.description ? { description: page.meta.description } : {}),
  isPartOf: { '@id': `${SITE_URL}/#website` },
  publisher: { '@id': `${SITE_URL}/#organization` },
  inLanguage: 'en',
})

/** Serialises JSON-LD safely for a <script> tag. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') })
