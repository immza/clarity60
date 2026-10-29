'use client'

/**
 * next/image loader. In production, media lives behind ImageKit, which resizes and
 * converts to WebP/AVIF on the fly, so our server never spends CPU on images. Locally
 * (no ImageKit) files are served as-is; the width param only keeps next/image happy.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith('https://ik.imagekit.io/')) {
    const tr = `tr=w-${width},q-${quality ?? 75},f-auto`
    return `${src}${src.includes('?') ? '&' : '?'}${tr}`
  }
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`
}
