import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'

import { Masthead } from '@/components/header/Masthead'
import { getSectionBySlug, getSectionCategories } from '@/lib/data'

import './section.css'

type Props = { params: Promise<{ section: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = await getSectionBySlug((await params).section)
  if (!section) return {}
  return {
    title: section.name,
    description: section.description ?? undefined,
    alternates: { canonical: `/${section.slug}` },
  }
}

export default async function SectionPage({ params }: Props) {
  const slug = (await params).section
  const section = await getSectionBySlug(slug)
  if (!section) notFound()
  if (section.slug !== slug) permanentRedirect(`/${section.slug}`)

  const categories = await getSectionCategories(section.id)

  return (
    <>
      <Masthead variant="compact" />
      <main id="main" className="wrap section-page">
        <p className="kicker">{section.kicker || 'Section'}</p>
        <h1 className="section-page__title">{section.name}</h1>
        {section.description && <p className="section-page__dek">{section.description}</p>}

        <nav aria-label={`${section.name} categories`}>
          <ul className="section-tabs">
            <li>
              <Link href={`/${section.slug}`} aria-current="page" prefetch={false}>
                All
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/${section.slug}/${c.slug}`} prefetch={false}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <hr className="rule" />
        <p className="section-page__soon">Stories for this desk appear here in Step 3.</p>
      </main>
    </>
  )
}
