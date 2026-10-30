import Image from 'next/image'
import Link from 'next/link'
import { cache } from 'react'

import { getActivePromotions, getAdSlot } from '@/lib/data'
import { pickPromotion, withinDates, type SlotContext } from '@/lib/promotions'
import type { Media, Promotion } from '@/payload-types'

import { PromoVideo } from './PromoVideo'
import './ads.css'

const adsenseReady = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT)

/** Promotions already shown during this page render, so none appears twice. */
const shownThisPage = cache(() => new Set<number>())

function HousePromo({ promo }: { promo: Promotion }) {
  const asMedia = (m: Promotion['image']) => (m && typeof m === 'object' && m.url ? (m as Media) : null)
  const image = asMedia(promo.image)
  const video = asMedia(promo.video)
  const style =
    promo.style === 'video' && video ? 'video' : (promo.style === 'wide' || promo.style === 'card') && image ? promo.style : 'notice'
  const external = /^https?:\/\//.test(promo.link)
  const paid = /sponsor|partner|advert/i.test(promo.label ?? '')
  const cta = (
    <span className="promo__cta">
      {promo.ctaLabel || 'Learn more'} <span aria-hidden="true">→</span>
    </span>
  )
  return (
    <aside className={`promo promo--${style}`} aria-label={promo.label || 'From Clarity60'}>
      {style === 'notice' && image && (
        <Image src={image.url!} alt="" width={72} height={72} className="promo__image" sizes="72px" />
      )}
      {(style === 'wide' || style === 'card') && (
        // Always the whole image: the frame takes the image's own shape, capped in size by CSS.
        <div className="promo__media">
          <Image
            src={image!.url!}
            alt=""
            width={image!.width ?? 1200}
            height={image!.height ?? 675}
            sizes={style === 'card' ? '240px' : '(min-width: 1000px) 760px, 100vw'}
          />
        </div>
      )}
      {style === 'video' && (
        <div className="promo__media">
          <PromoVideo key={video!.url!} src={video!.url!} type={video!.mimeType ?? undefined} poster={image?.url ?? undefined} label={promo.headline} />
        </div>
      )}
      <div className="promo__body">
        <p className="promo__label">{promo.label || 'From Clarity60'}</p>
        <p className="promo__headline">{promo.headline}</p>
        {promo.text && <p className="promo__text">{promo.text}</p>}
        {external ? (
          <a href={promo.link} target="_blank" rel={paid ? 'sponsored noopener' : 'noopener'}>
            {cta}
          </a>
        ) : (
          <Link href={promo.link} prefetch={false}>
            {cta}
          </Link>
        )}
      </div>
    </aside>
  )
}

/**
 * An ad placement controlled from Revenue → Ad Slots.
 * - off: nothing (the space collapses)
 * - direct: the sold ad within its dates, else a house promotion
 * - adsense: AdSense once configured, else a house promotion
 * - house: a matching house promotion, if any
 * Paid ads reserve their exact size so nothing shifts while they load.
 */
export async function AdSlot({ slotKey, context = {}, className }: { slotKey: string; context?: SlotContext; className?: string }) {
  const slot = await getAdSlot(slotKey)
  if (!slot || slot.mode === 'off') return null

  const creative = slot.creative && typeof slot.creative === 'object' ? slot.creative : null
  const directLive = slot.mode === 'direct' && creative?.url && slot.link && withinDates(slot.directStartsAt, slot.directEndsAt)
  const adsenseLive = slot.mode === 'adsense' && adsenseReady && slot.adsenseSlotId

  if (!directLive && !adsenseLive) {
    const shown = shownThisPage()
    const promo = pickPromotion(
      (await getActivePromotions()).filter((p) => !shown.has(p.id)),
      slot.id,
      context,
    )
    if (promo) shown.add(promo.id)
    return promo ? (
      <div className={`slot ${className ?? ''}`}>
        <HousePromo promo={promo} />
      </div>
    ) : null
  }

  return (
    <aside className={`ad ad--${slot.size} slot ${className ?? ''}`} aria-label="Advertisement">
      <p className="ad__label">Advertisement</p>
      <div className="ad__box">
        {directLive ? (
          <a href={slot.link!} rel="sponsored noopener" target="_blank">
            <Image
              src={creative!.url!}
              alt={creative!.alt || slot.sponsor || 'Advertisement'}
              width={creative!.width ?? 300}
              height={creative!.height ?? 250}
              sizes="(min-width: 728px) 728px, 100vw"
            />
          </a>
        ) : (
          <div className="ad__fill" data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT} data-ad-slot={slot.adsenseSlotId!} />
        )}
      </div>
    </aside>
  )
}
