import { Masthead } from '@/components/header/Masthead'
import { RichText } from '@/components/RichText'
import type { Page } from '@/payload-types'

import '@/components/article/article.css'

/** About, Contact, Privacy and other pages edited under Admin → Pages. */
export function StaticPage({ page }: { page: Page }) {
  return (
    <>
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
