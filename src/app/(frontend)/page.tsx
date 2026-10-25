import Link from 'next/link'

import { Masthead } from '@/components/header/Masthead'
import { getSections } from '@/lib/data'

import './front.css'

export default async function FrontPage() {
  const sections = await getSections()

  return (
    <>
      <Masthead variant="front" />
      <main id="main" className="wrap front">
        {/* Placeholder until the Front Page modules land in Step 3. */}
        <section className="front__preview" aria-labelledby="preview-title">
          <p className="kicker">Design preview · Step 2</p>
          <h2 id="preview-title" className="front__headline">
            How a Steel Box Rebuilt the World Economy
          </h2>
          <p className="front__dek">
            In 1956, a trucking man named Malcolm McLean loaded 58 metal boxes onto a ship in New Jersey. Trade was
            never the same again.
          </p>
          <div className="front__figure hatch" role="img" aria-label="Illustration placeholder" />
          <p className="front__caption">The Ideal X leaves Port Newark, April 1956.</p>
          <p className="front__body">
            The real front page arrives in Step 3: The Latest, the lead story, the Latest feed, Most Read and the
            ad slots, all filled from the CMS. Use the <strong>Morning/Night Edition</strong> stamp above to try
            both themes, and resize the window to see the phone layout.
          </p>
        </section>

        <section aria-labelledby="desks-title" className="front__desks">
          <h2 id="desks-title" className="front__desks-title">
            The desks
          </h2>
          <ul>
            {sections.map((s) => (
              <li key={s.id}>
                <Link href={`/${s.slug}`} prefetch={false}>
                  <span className="kicker">{s.kicker || 'Section'}</span>
                  <strong>{s.name}</strong>
                  <span>{s.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
