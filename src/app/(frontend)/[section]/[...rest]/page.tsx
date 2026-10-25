import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { ArticleView } from '@/components/article/ArticleView'
import { Masthead } from '@/components/header/Masthead'
import { StoryList } from '@/components/story/StoryList'
import { getSubcategories, listArticles } from '@/lib/data'
import { resolveSectionPath } from '@/lib/resolve'
import { absolute, breadcrumbSchema, jsonLd } from '@/lib/schema'
import type { Category, Media, Section } from '@/payload-types'

import '../section.css'

type Props = {
  params: Promise<{ section: string; rest: string[] }>
  searchParams: Promise<{ page?: string }>
}

const pageNumber = (raw?: string) => Math.max(1, Math.min(1000, Number.parseInt(raw ?? '1', 10) || 1))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { section, rest } = await params
  const resolved = await resolveSectionPath(section, rest)
  if (!resolved || resolved.type === 'redirect') return {}

  if (resolved.type === 'article') {
    const a = resolved.article
    const image = a.meta?.image ?? a.heroMedia
    const img = image && typeof image === 'object' ? (image as Media) : null
    return {
      title: { absolute: a.meta?.title || `${a.title} · Clarity60` },
      description: a.meta?.description || a.summary,
      alternates: { canonical: a.path! },
      openGraph: {
        type: 'article',
        title: a.title,
        description: a.summary,
        url: absolute(a.path!),
        siteName: 'Clarity60',
        publishedTime: a.publishedAt ?? undefined,
        modifiedTime: a.updatedAt,
        section: resolved.section.name,
        ...(img?.url ? { images: [{ url: absolute(img.url), width: img.width ?? undefined, height: img.height ?? undefined, alt: img.alt }] } : {}),
      },
      twitter: { card: 'summary_large_image', title: a.title, description: a.summary },
    }
  }

  const { category, parent } = resolved
  const page = pageNumber((await searchParams).page)
  const path = `/${resolved.section.slug}/${parent ? `${parent.slug}/` : ''}${category.slug}`
  return {
    title: page > 1 ? `${category.name} · Page ${page}` : `${category.name} · ${resolved.section.name}`,
    description: category.description ?? undefined,
    alternates: { canonical: page > 1 ? `${path}?page=${page}` : path },
  }
}

async function CategoryView({
  section,
  category,
  parent,
  page,
}: {
  section: Section
  category: Category
  parent: Category | null
  page: number
}) {
  const top = parent ?? category
  const base = `/${section.slug}/${top.slug}`
  const path = parent ? `${base}/${category.slug}` : base
  const subs = await getSubcategories(top.id)
  // A top-level category also lists stories filed under its sub-categories.
  const categoryIds = parent ? [category.id] : [category.id, ...subs.map((s) => s.id)]
  const result = await listArticles({ categoryIds, page, limit: 12 })
  if (page > 1 && result.docs.length === 0) notFound()

  const crumbs = [
    { name: 'Front Page', path: '/' },
    { name: section.name, path: `/${section.slug}` },
    ...(parent ? [{ name: parent.name, path: base }] : []),
    { name: category.name, path },
  ]

  return (
    <main id="main" className="wrap section-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(crumbs))} />
      <p className="kicker">
        <Link href={`/${section.slug}`} prefetch={false}>
          {section.name}
        </Link>
        {parent && ` · ${parent.name}`}
      </p>
      <h1 className="section-page__title">{category.name}</h1>
      {category.description && <p className="section-page__dek">{category.description}</p>}

      {subs.length > 0 && (
        <nav aria-label={`${top.name} topics`}>
          <ul className="section-tabs">
            <li>
              <Link href={base} aria-current={!parent ? 'page' : undefined} prefetch={false}>
                All {top.name}
              </Link>
            </li>
            {subs.map((s) => (
              <li key={s.id}>
                <Link href={`${base}/${s.slug}`} aria-current={s.id === category.id ? 'page' : undefined} prefetch={false}>
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <hr className="rule" />

      <StoryList
        stories={result.docs}
        basePath={path}
        page={page}
        totalPages={result.totalPages}
        adKey="section-in-feed"
        variant={section.kind === 'news' ? 'list' : 'grid'}
        emptyText={`No ${category.name} stories yet. Check back soon.`}
      />
    </main>
  )
}

export default async function SectionChildPage({ params, searchParams }: Props) {
  const { section, rest } = await params
  const resolved = await resolveSectionPath(section, rest)
  if (!resolved) notFound()
  if (resolved.type === 'redirect') permanentRedirect(resolved.to)

  return (
    <>
      <Masthead variant="compact" />
      {resolved.type === 'article' ? (
        <ArticleView article={resolved.article} />
      ) : (
        <CategoryView
          section={resolved.section}
          category={resolved.category}
          parent={resolved.parent}
          page={pageNumber((await searchParams).page)}
        />
      )}
    </>
  )
}
