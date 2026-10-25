import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Masthead } from '@/components/header/Masthead'
import { StoryList } from '@/components/story/StoryList'
import { getTag, listArticles } from '@/lib/data'
import { breadcrumbSchema, jsonLd } from '@/lib/schema'

import '../../[section]/section.css'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

const pageNumber = (raw?: string) => Math.max(1, Math.min(1000, Number.parseInt(raw ?? '1', 10) || 1))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const tag = await getTag((await params).slug)
  if (!tag) return {}
  const page = pageNumber((await searchParams).page)
  return {
    title: page > 1 ? `${tag.name} · Page ${page}` : tag.name,
    description: tag.description || `Every Clarity60 story about ${tag.name}.`,
    alternates: { canonical: page > 1 ? `/tag/${tag.slug}?page=${page}` : `/tag/${tag.slug}` },
  }
}

/** Topic pages: one per tag, collecting every story on that subject across desks. */
export default async function TagPage({ params, searchParams }: Props) {
  const tag = await getTag((await params).slug)
  if (!tag) notFound()
  const page = pageNumber((await searchParams).page)
  const result = await listArticles({ tagId: tag.id, page, limit: 12 })
  if (page > 1 && result.docs.length === 0) notFound()

  return (
    <>
      <Masthead variant="compact" />
      <main id="main" className="wrap section-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            breadcrumbSchema([
              { name: 'Front Page', path: '/' },
              { name: tag.name, path: `/tag/${tag.slug}` },
            ]),
          )}
        />
        <p className="kicker">Topic</p>
        <h1 className="section-page__title">{tag.name}</h1>
        {tag.description && <p className="section-page__dek">{tag.description}</p>}
        <hr className="rule-double" />
        <StoryList stories={result.docs} basePath={`/tag/${tag.slug}`} page={page} totalPages={result.totalPages} adKey="section-in-feed" />
      </main>
    </>
  )
}
