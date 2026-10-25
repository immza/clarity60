import Image from 'next/image'

import type { Media } from '@/payload-types'

type Props = {
  media: Media | number | null | undefined
  sizes: string
  priority?: boolean
  className?: string
  /** Placeholder label when there is no image (keeps the newspaper hatch look). */
  fallbackLabel?: string
}

const isMedia = (m: Props['media']): m is Media => Boolean(m && typeof m === 'object' && m.url)

/**
 * Story image with reserved aspect ratio (no layout shift). Videos show their poster
 * frame here; the article page plays them. Delivery moves to ImageKit when its keys
 * are configured.
 */
export function MediaImage({ media, sizes, priority, className, fallbackLabel }: Props) {
  if (!isMedia(media) || media.mimeType?.startsWith('video/')) {
    return (
      <div className={`media media--empty hatch ${className ?? ''}`} aria-hidden="true">
        {fallbackLabel && <span className="media__label">{fallbackLabel}</span>}
      </div>
    )
  }

  return (
    <div className={`media ${className ?? ''}`}>
      <Image
        src={media.url!}
        alt={media.alt}
        width={media.width ?? 1200}
        height={media.height ?? 750}
        sizes={sizes}
        priority={priority}
        style={{
          objectFit: 'cover',
          objectPosition: `${media.focalX ?? 50}% ${media.focalY ?? 50}%`,
        }}
      />
    </div>
  )
}
