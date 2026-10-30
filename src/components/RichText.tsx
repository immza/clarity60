import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'
import { type JSXConvertersFunction, RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { MediaImage } from '@/components/media/MediaImage'
import type { AffiliateLink, FaqBlock, Media, ProductBlock } from '@/payload-types'

type LinkFields = {
  url?: string
  newTab?: boolean
  linkType?: 'custom' | 'internal'
  sponsored?: boolean
  doc?: { relationTo?: string; value?: unknown } | null
}

/** Where a link goes: articles/pages by path, affiliate links through /go/ for tracking. */
const resolveLink = (fields: LinkFields) => {
  if (fields.linkType !== 'internal') return { href: fields.url ?? '#', affiliate: false }
  const value = fields.doc?.value
  if (!value || typeof value !== 'object') return { href: '#', affiliate: false }
  if (fields.doc?.relationTo === 'affiliate-links') return { href: `/go/${(value as AffiliateLink).slug}`, affiliate: true }
  if ('path' in value && typeof value.path === 'string') return { href: value.path, affiliate: false }
  if ('slug' in value) return { href: `/${(value as { slug: string }).slug}`, affiliate: false }
  return { href: '#', affiliate: false }
}

const relFor = ({ external, sponsored, newTab }: { external: boolean; sponsored: boolean; newTab: boolean }) =>
  [sponsored && 'sponsored', (sponsored || newTab) && 'noopener', external && !sponsored && newTab && 'noreferrer']
    .filter(Boolean)
    .join(' ') || undefined

const makeConverters =
  (sponsoredArticle: boolean): JSXConvertersFunction =>
  ({ defaultConverters }) => {
    const link = ({ node, nodesToJSX }: { node: { fields: LinkFields; children: SerializedLexicalNode[] }; nodesToJSX: (a: { nodes: SerializedLexicalNode[] }) => ReactNode[] }) => {
      const { href, affiliate } = resolveLink(node.fields)
      const external = /^https?:\/\//.test(href)
      // In a sponsored article every outbound link is treated as paid.
      const sponsored = Boolean(node.fields.sponsored || affiliate || (sponsoredArticle && external))
      const newTab = Boolean(node.fields.newTab || sponsored)
      return (
        <a href={href} rel={relFor({ external, sponsored, newTab })} target={newTab ? '_blank' : undefined}>
          {nodesToJSX({ nodes: node.children })}
        </a>
      )
    }

    return {
      ...defaultConverters,
      link,
      autolink: link,
      // In-body images become captioned, credited figures.
      upload: ({ node }) => {
        const media = node.value as Media | number
        if (!media || typeof media !== 'object') return null
        return (
          <figure className="prose__figure">
            <MediaImage media={media} sizes="(min-width: 760px) 680px, 100vw" />
            {(media.caption || media.credit) && (
              <figcaption>
                {media.caption}
                {media.credit && <span className="prose__credit"> {media.credit}</span>}
              </figcaption>
            )}
          </figure>
        )
      },
      blocks: {
        faq: ({ node }: { node: { fields: FaqBlock } }) => {
          const f = node.fields
          if (!f.items?.length) return null
          return (
            <section className="faq">
              <h2 className="faq__heading">{f.heading || 'Questions answered'}</h2>
              {f.items.map((item) => (
                <div key={item.id ?? item.question} className="faq__item">
                  <h3 className="faq__question">{item.question}</h3>
                  <p className="faq__answer">{item.answer}</p>
                </div>
              ))}
            </section>
          )
        },
        product: ({ node }: { node: { fields: ProductBlock } }) => {
          const f = node.fields
          const link = f.affiliateLink && typeof f.affiliateLink === 'object' ? f.affiliateLink : null
          if (!link) return null
          const image = f.image && typeof f.image === 'object' ? f.image : null
          return (
            <aside className="product" aria-label={`Recommended: ${f.title}`}>
              {image && <MediaImage media={image} sizes="96px" className="product__image" />}
              <div className="product__body">
                <p className="product__label">Recommended</p>
                <p className="product__title">{f.title}</p>
                {f.reason && <p className="product__reason">{f.reason}</p>}
                <a className="product__cta" href={`/go/${link.slug}`} rel="sponsored noopener" target="_blank">
                  {f.ctaLabel || 'See price'} <span aria-hidden="true">↗</span>
                </a>
              </div>
            </aside>
          )
        },
      },
    }
  }

type Props = {
  data: SerializedEditorState | null | undefined
  className?: string
  sponsored?: boolean
  /** Inserts a node (e.g. an ad slot) after this many top-level blocks, if the body is long enough. */
  insert?: { after: number; minBlocks: number; node: ReactNode }
}

export function RichText({ data, className, sponsored = false, insert }: Props) {
  if (!data) return null
  const converters = makeConverters(sponsored)
  const children = data.root.children
  const split = insert && children.length >= insert.minBlocks

  if (!split) return <LexicalRichText data={data} converters={converters} className={className} />

  const part = (nodes: typeof children): SerializedEditorState => ({ ...data, root: { ...data.root, children: nodes } })
  return (
    <div className={className}>
      <LexicalRichText data={part(children.slice(0, insert.after))} converters={converters} disableContainer />
      {insert.node}
      <LexicalRichText data={part(children.slice(insert.after))} converters={converters} disableContainer />
    </div>
  )
}
