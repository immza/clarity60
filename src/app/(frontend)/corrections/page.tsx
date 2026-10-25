import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Masthead } from '@/components/header/Masthead'
import { getAllCorrections } from '@/lib/data'
import type { Article } from '@/payload-types'

import '../[section]/section.css'

export const metadata: Metadata = {
  title: 'Corrections',
  description: 'Every correction Clarity60 has published, stated plainly.',
  alternates: { canonical: '/corrections' },
}

type Props = { searchParams: Promise<{ page?: string }> }

const day = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso))

/** Public corrections log: a trust signal for readers, search engines and AI assistants. */
export default async function CorrectionsPage({ searchParams }: Props) {
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? '1', 10) || 1)
  const result = await getAllCorrections(page)
  if (page > 1 && !result.docs.length) notFound()

  return (
    <>
      <Masthead variant="compact" />
      <main id="main" className="wrap section-page">
        <p className="kicker">Standards</p>
        <h1 className="section-page__title">Corrections</h1>
        <p className="section-page__dek">
          When we get something wrong, we fix it and say so here, plainly. The corrected story carries the same note.
        </p>
        <hr className="rule-double" />
        {result.docs.length === 0 ? (
          <p className="story-list__empty">No corrections yet.</p>
        ) : (
          <ol className="corrections-log">
            {result.docs.map((c) => {
              const a = c.article && typeof c.article === 'object' ? (c.article as Article) : null
              return (
                <li key={c.id}>
                  <time dateTime={c.date}>{day(c.date)}</time>
                  <p>{c.text}</p>
                  {a?.path && a._status === 'published' && (
                    <Link href={a.path} prefetch={false}>
                      {a.title}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        )}
        {result.totalPages > 1 && (
          <nav className="pager" aria-label="Pages">
            {page > 1 && <Link href={page === 2 ? '/corrections' : `/corrections?page=${page - 1}`}>← Newer</Link>}
            <span>
              Page {page} of {result.totalPages}
            </span>
            {page < result.totalPages && <Link href={`/corrections?page=${page + 1}`}>Older →</Link>}
          </nav>
        )}
      </main>
    </>
  )
}
