'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * A promotion's silent looping clip. It plays only while on screen, and not at all for
 * readers who ask for reduced motion (they see the still and get play controls). The
 * preference is followed live, even if it changes while the clip is on screen.
 */
export function PromoVideo({ src, type, poster, label }: { src: string; type?: string; poster?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (reduced) {
      video.pause()
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    })
    observer.observe(video)
    return () => observer.disconnect()
  }, [reduced])

  return (
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
  )
}
