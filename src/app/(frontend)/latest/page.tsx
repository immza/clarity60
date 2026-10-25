import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Masthead } from '@/components/header/Masthead'
import { StoryList } from '@/components/story/StoryList'
import { listArticles } from '@/lib/data'

import '../[section]/section.css'

type Props = { searchParams: Promise<{ page?: string }> }

const pageNumber = (raw?: string) => Math.max(1, Math.min(1000, Number.parseInt(raw ?? '1', 10) || 1))

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pageNumber((await searchParams).page)
  return {
    title: page > 1 ? `Latest stories · Page ${page}` : 'Latest stories',
    description: 'Every Clarity60 story, newest first.',
    alternates: { canonical: page > 1 ? `/latest?page=${page}` : '/latest' },
  }
}

export default async function LatestPage({ searchParams }: Props) {
  const page = pageNumber((await searchParams).page)
  const result = await listArticles({ page, limit: 20 })
  if (page > 1 && result.docs.length === 0) notFound()

  return (
    <>
      <Masthead variant="compact" />
      <main id="main" className="wrap section-page">
        <p className="kicker">Every desk</p>
        <h1 className="section-page__title">Latest</h1>
        <p className="section-page__dek">Every story, newest first.</p>
        <hr className="rule" />
        <StoryList
          stories={result.docs}
          basePath="/latest"
          page={page}
          totalPages={result.totalPages}
          adKey="home-in-feed"
        />
      </main>
    </>
  )
}
