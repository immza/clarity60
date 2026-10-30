'use client'

import { useEffect, useRef } from 'react'

/**
 * A promotion's silent looping clip. It plays only while on screen, and not at all for
 * readers who ask for reduced motion (they see the still and can press play).
 */
export function PromoVideo({ src, type, poster }: { src: string; type?: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.controls = true
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {})
      else video.pause()
    })
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <video ref={ref} className="promo__video" muted loop playsInline preload="metadata" poster={poster} aria-hidden="true">
      <source src={src} type={type} />
    </video>
  )
}
