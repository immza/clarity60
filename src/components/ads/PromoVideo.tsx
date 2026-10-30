'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * A promotion's silent looping clip. It plays only while on screen and always has a
 * Pause button; a reader's pause sticks when it scrolls back into view. Readers who ask
 * for reduced motion get no autoplay, just the still and the native play controls. The
 * preference is followed live, even if it changes while the clip is on screen.
 */
export function PromoVideo({ src, type, poster, label }: { src: string; type?: string; poster?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const autoplay = !reduced && !paused
    if (!autoplay) video.pause()
    // Always pause off screen (even a clip the reader started); only autoplay back on screen.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) video.pause()
      else if (autoplay) video.play().catch(() => {})
    })
    observer.observe(video)
    return () => observer.disconnect()
  }, [reduced, paused])

  return (
    <>
      <video
        ref={ref}
        className="promo__video"
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        controls={reduced}
        // Decorative while it plays by itself; a real, named control when the reader drives it.
        aria-hidden={reduced ? undefined : true}
        aria-label={reduced ? label : undefined}
      >
        <source src={src} type={type} />
      </video>
      {!reduced && (
        <button
          type="button"
          className="promo__pause"
          aria-label={paused ? `Play video: ${label}` : `Pause video: ${label}`}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? '▶ Play' : '❚❚ Pause'}
        </button>
      )}
    </>
  )
}
