import type { Metadata } from 'next'

import { Masthead } from '@/components/header/Masthead'
import { SearchForm } from '@/components/header/SearchForm'
import { StoryList } from '@/components/story/StoryList'
import { searchArticles } from '@/lib/search'
import { MAX_QUERY_LENGTH, searchTerms } from '@/lib/text'

import '../[section]/section.css'

type Props = { searchParams: Promise<{ q?: string | string[]; page?: string }> }

const pageNumber = (raw?: string) => Math.max(1, Math.min(100, Number.parseInt(raw ?? '1', 10) || 1))
const queryOf = (raw?: string | string[]) => (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, MAX_QUERY_LENGTH) ?? ''

// Search results are thin, endless pages; Google asks sites to keep them out of the index.
export const metadata: Metadata = {
  title: 'Search',
  description: 'Search every Clarity60 story.',
  robots: { index: false, follow: true },
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const q = queryOf(params.q)
  const page = pageNumber(params.page)
  const terms = searchTerms(q)
  const result = terms.length > 0 ? await searchArticles(terms, page) : null

  return (
    <>
      <Masthead variant="compact" />
      <main id="main" className="wrap section-page">
        <p className="kicker">Every desk</p>
        <h1 className="section-page__title">Search</h1>
        <SearchForm defaultValue={q} variant="page" />
        <hr className="rule" />
        {result ? (
          <>
            <p className="search-page__count" role="status">
              {result.totalDocs === 0
                ? `No stories match “${q}”.`
                : `${result.totalDocs} ${result.totalDocs === 1 ? 'story matches' : 'stories match'} “${q}”.`}
            </p>
            <StoryList
              stories={result.docs}
              basePath={`/search?q=${encodeURIComponent(q)}`}
              page={page}
              totalPages={result.totalPages}
              emptyText="Try fewer or different words, or browse the sections from the menu."
              fullPageLinks
            />
          </>
        ) : (
          <p className="section-page__dek">Search headlines and summaries from every desk.</p>
        )}
      </main>
    </>
  )
}
