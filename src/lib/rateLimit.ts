/**
 * Small in-memory fixed-window rate limiter. The app runs as a single container, so a
 * process-local map is enough; Cloudflare's firewall rule adds an edge limit on top.
 */
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastSweep = 0

export const rateLimit = (key: string, limit: number, windowMs: number, now = Date.now()) => {
  // Drop expired buckets now and then so the map cannot grow without bound.
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    lastSweep = now
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }
  bucket.count++
  return bucket.count > limit
    ? { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
    : { allowed: true, retryAfter: 0 }
}

/** The real visitor IP: Cloudflare sets cf-connecting-ip; fall back for local/dev. */
export const clientIp = (headers: Headers) =>
  headers.get('cf-connecting-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
