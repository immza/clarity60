'use client'

import { useEffect, useRef, useState } from 'react'

import type { Embed } from '@/lib/embeds'

import './embed.css'

/** Starting heights for players that report their real height once loaded. */
const START_HEIGHT: Record<string, number> = { x: 560, instagram: 720 }

/** Reads the height X and Instagram players post to the page, so the frame fits the post. */
const reportedHeight = (data: unknown): number | undefined => {
  try {
    const msg = typeof data === 'string' ? JSON.parse(data) : data
    const x = msg?.['twttr.embed']
    if (x?.method === 'twttr.private.resize') return Number(x.params?.[0]?.height) || undefined
    if (msg?.type === 'MEASURE') return Number(msg.details?.height) || undefined
  } catch {
    // Not a message from a player.
  }
  return undefined
}

/**
 * A social post inside an article: a plain card until the reader taps "Load post", then
 * the platform's own player. Nothing from the platform loads before that tap.
 */
export function EmbedCard({ embed, caption }: { embed: Embed; caption?: string | null }) {
  const [loaded, setLoaded] = useState(false)
  const [height, setHeight] = useState(START_HEIGHT[embed.platform])
  const frame = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!loaded || !(embed.platform in START_HEIGHT)) return
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      const h = reportedHeight(e.data)
      if (h && h > 100) setHeight(Math.ceil(h))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [loaded, embed.platform])

  const label = `${embed.name} post${embed.handle ? ` by @${embed.handle}` : ''}`

  return (
    <figure className={`embed embed--${embed.shape}`}>
      {loaded ? (
        <iframe
          ref={frame}
          className="embed__frame"
          src={embed.src}
          title={label}
          style={height ? { height } : undefined}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
          allowFullScreen
        />
      ) : (
        <div className="embed__card hatch">
          <p className="embed__platform">{embed.name}</p>
          {embed.handle && <p className="embed__handle">@{embed.handle}</p>}
          <button type="button" className="embed__load" onClick={() => setLoaded(true)}>
            ▶ Load post
          </button>
          <p className="embed__note">Loads content from {embed.name}, which may set cookies.</p>
        </div>
      )}
      <figcaption>
        {caption && <span>{caption} </span>}
        <a href={embed.url} target="_blank" rel="noopener nofollow">
          View on {embed.name} ↗
        </a>
      </figcaption>
    </figure>
  )
}
