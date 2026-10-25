import type { Promotion } from '@/payload-types'

import { idOf } from './relations'

export type SlotContext = { sectionId?: number | null; categoryIds?: number[] }

const matches = (ids: unknown[] | null | undefined, wanted: (number | null | undefined)[]) =>
  !ids?.length || ids.some((v) => wanted.includes(idOf(v) as number))

/**
 * Picks a promotion for a slot: it must allow this slot, section and category. Among
 * matches, weight decides; the choice rotates hourly so cached pages vary over a day.
 */
export const pickPromotion = (promos: Promotion[], slotId: number, ctx: SlotContext): Promotion | null => {
  const eligible = promos.filter(
    (p) =>
      matches(p.slots, [slotId]) &&
      matches(p.sections, [ctx.sectionId]) &&
      matches(p.categories, ctx.categoryIds ?? []),
  )
  if (!eligible.length) return null
  const total = eligible.reduce((sum, p) => sum + (p.weight ?? 1), 0)
  let ticket = (Math.floor(Date.now() / 3_600_000) * 31 + slotId * 17) % total
  for (const p of eligible) {
    ticket -= p.weight ?? 1
    if (ticket < 0) return p
  }
  return eligible[0]
}

/** True when now falls between the optional start and end dates. */
export const withinDates = (startsAt?: string | null, endsAt?: string | null) => {
  const now = Date.now()
  return (!startsAt || new Date(startsAt).getTime() <= now) && (!endsAt || new Date(endsAt).getTime() > now)
}
