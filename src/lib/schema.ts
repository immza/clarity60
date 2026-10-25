import type { Article, Author, Category, Media, Section, Tag } from '@/payload-types'

/** Absolute site origin for canonical URLs and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const absolute = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

const obj = <T,>(v: T | number | null | undefined): T | null => (v && typeof v === 'object' ? v : null)

export const organization = () => ({
  '@type': 'NewsMediaOrganization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Clarity60',
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: absolute('/icon.png'), width: 512, height: 512 },
  sameAs: ['https://www.instagram.com/theclarity60/'],
})

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
export const articleSchema = (article: Article) => {
  const section = obj<Section>(article.section)
  const category = obj<Category>(article.category)
  const hero = obj<Media>(article.heroMedia)
  const authors = (article.authors ?? []).map((a) => obj<Author>(a)).filter((a): a is Author => Boolean(a))
  const tags = (article.tags ?? []).map((t) => obj<Tag>(t)?.name).filter(Boolean)
  const url = absolute(article.path ?? '/')

  return {
    '@context': 'https://schema.org',
    '@type': section?.kind === 'news' ? 'NewsArticle' : 'Article',
    '@id': `${url}#article`,
    headline: article.title.slice(0, 110),
    description: article.meta?.description || article.summary,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(hero?.url ? { image: [absolute(hero.url)] } : {}),
    datePublished: article.publishedAt ?? article.createdAt,
    dateModified: article.updatedAt,
    author: authors.length ? authors.map(personSchema) : [organization()],
    publisher: organization(),
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

/** Serialises JSON-LD safely for a <script> tag. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') })
