import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { type JSXConvertersFunction, LinkJSXConverter, RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

import { MediaImage } from '@/components/media/MediaImage'
import type { Media } from '@/payload-types'

const internalHref = ({ linkNode }: { linkNode: { fields: { doc?: { value?: unknown } | null } } }) => {
  const value = linkNode.fields.doc?.value
  return value && typeof value === 'object' && 'path' in value && typeof value.path === 'string'
    ? value.path
    : value && typeof value === 'object' && 'slug' in value
      ? `/${(value as { slug: string }).slug}`
      : '#'
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: internalHref }),
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
})

export function RichText({ data, className }: { data: SerializedEditorState | null | undefined; className?: string }) {
  if (!data) return null
  return <LexicalRichText data={data} converters={converters} className={className} />
}
