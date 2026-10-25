import Image from 'next/image'

import { getAdSlot } from '@/lib/data'

import './ads.css'

/**
 * An ad placement controlled from Admin → Ad Slots. "Off" renders nothing (the space
 * collapses); AdSense and direct ads reserve their exact size so nothing shifts.
 * AdSense code is only injected once AdSense is approved and consent is in place.
 */
export async function AdSlot({ slotKey, className }: { slotKey: string; className?: string }) {
  const slot = await getAdSlot(slotKey)
  if (!slot || slot.mode === 'off') return null

  const creative = slot.creative && typeof slot.creative === 'object' ? slot.creative : null

  return (
    <aside className={`ad ad--${slot.size} ${className ?? ''}`} aria-label="Advertisement">
      <p className="ad__label">Advertisement</p>
      <div className="ad__box">
        {slot.mode === 'direct' && creative?.url && slot.link ? (
          <a href={slot.link} rel="sponsored noopener" target="_blank">
            <Image
              src={creative.url}
              alt={creative.alt || slot.sponsor || 'Advertisement'}
              width={creative.width ?? 300}
              height={creative.height ?? 250}
              sizes="(min-width: 728px) 728px, 100vw"
            />
          </a>
        ) : (
          <div className="ad__fill" data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT} data-ad-slot={slot.adsenseSlotId} />
        )}
      </div>
    </aside>
  )
}
