import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Masthead } from '@/components/header/Masthead'
import { MediaImage } from '@/components/media/MediaImage'
import { StoryList } from '@/components/story/StoryList'
import { getAuthor, listArticles } from '@/lib/data'
import { breadcrumbSchema, jsonLd, personSchema } from '@/lib/schema'

import '../../[section]/section.css'
import './author.css'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

const pageNumber = (raw?: string) => Math.max(1, Math.min(1000, Number.parseInt(raw ?? '1', 10) || 1))

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const author = await getAuthor((await params).slug)
  if (!author) return {}
  const page = pageNumber((await searchParams).page)
  return {
    title: page > 1 ? `${author.name} · Page ${page}` : author.name,
    description: author.bio ?? undefined,
    alternates: { canonical: page > 1 ? `/author/${author.slug}?page=${page}` : `/author/${author.slug}` },
  }
}

/** Author pages carry bio and credentials, which search and AI engines use to judge expertise. */
export default async function AuthorPage({ params, searchParams }: Props) {
  const author = await getAuthor((await params).slug)
  if (!author) notFound()
  const page = pageNumber((await searchParams).page)
  const result = await listArticles({ authorId: author.id, page, limit: 12 })
  if (page > 1 && result.docs.length === 0) notFound()

  return (
    <>
      <Masthead variant="compact" />
      <main id="main" className="wrap section-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd({ '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: personSchema(author) })}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            breadcrumbSchema([
              { name: 'Front Page', path: '/' },
              { name: author.name, path: `/author/${author.slug}` },
            ]),
          )}
        />
        <div className="author-head">
          {author.photo && typeof author.photo === 'object' && (
            <MediaImage media={author.photo} sizes="120px" className="author-head__photo" />
          )}
          <div>
            <p className="kicker">{author.jobTitle || 'Clarity60'}</p>
            <h1 className="section-page__title">{author.name}</h1>
            {author.bio && <p className="section-page__dek">{author.bio}</p>}
            {author.credentials && <p className="author-head__creds">{author.credentials}</p>}
            {author.socials && author.socials.length > 0 && (
              <ul className="author-head__links">
                {author.socials.map((s) => (
                  <li key={s.id ?? s.url}>
                    <a href={s.url} rel="me noopener" target="_blank">
                      {new URL(s.url).hostname.replace(/^www\./, '')}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <hr className="rule-double" />
        <StoryList
          stories={result.docs}
          basePath={`/author/${author.slug}`}
          page={page}
          totalPages={result.totalPages}
          emptyText={`${author.name} hasn’t published anything yet.`}
        />
      </main>
    </>
  )
}
