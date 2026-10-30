import { Masthead } from '@/components/header/Masthead'
import { RichText } from '@/components/RichText'
import { getSiteSettings } from '@/lib/data'
import { faqSchema, jsonLd, webPageSchema } from '@/lib/schema'
import type { Page } from '@/payload-types'

import '@/components/article/article.css'

/** About, Contact, Privacy and other pages edited under Admin → Pages. */
export async function StaticPage({ page }: { page: Page }) {
  const faq = faqSchema({ body: page.body, path: `/${page.slug}` }, await getSiteSettings())
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(webPageSchema(page))} />
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faq)} />}
      <Masthead variant="compact" />
      <main id="main" className="wrap article-layout">
        <article className="article">
          <h1 className="article__title">{page.title}</h1>
          <RichText data={page.body} className="prose prose--plain" />
        </article>
      </main>
    </>
  )
}
