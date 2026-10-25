import type { Article, Category, Section } from '@/payload-types'

import { getArticle, getCategory, getRedirect, getSectionBySlug } from './data'

export type Resolved =
  | { type: 'redirect'; to: string }
  | { type: 'category'; section: Section; category: Category; parent: Category | null }
  | { type: 'article'; section: Section; article: Article }
  | null

/**
 * Turns /{section}/{...rest} into a category or article page. Structure wins over
 * articles at the same depth. Anything renamed or moved resolves to its current URL
 * with a 301; unknown paths fall back to the redirects table.
 */
export async function resolveSectionPath(sectionSlug: string, rest: string[]): Promise<Resolved> {
  const requested = `/${[sectionSlug, ...rest].join('/')}`
  const section = await getSectionBySlug(sectionSlug)

  if (section && rest.length <= 2) {
    const top = await getCategory(section.id, rest[0], null)
    if (top && rest.length === 1) {
      const canonical = `/${section.slug}/${top.slug}`
      return canonical === requested ? { type: 'category', section, category: top, parent: null } : { type: 'redirect', to: canonical }
    }
    if (top && rest.length === 2) {
      const sub = await getCategory(section.id, rest[1], top.id)
      if (sub) {
        const canonical = `/${section.slug}/${top.slug}/${sub.slug}`
        return canonical === requested ? { type: 'category', section, category: sub, parent: top } : { type: 'redirect', to: canonical }
      }
    }
  }

  if (section && rest.length >= 2) {
    const article = await getArticle(section.id, rest[rest.length - 1])
    if (article?.path) {
      return article.path === requested ? { type: 'article', section, article } : { type: 'redirect', to: article.path }
    }
  }

  const target = await getRedirect(requested)
  return target && target !== requested ? { type: 'redirect', to: target } : null
}
