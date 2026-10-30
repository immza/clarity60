/**
 * Small in-memory fixed-window rate limiter. The app runs as a single container, so a
 * process-local map is enough.
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

/**
 * The visitor IP for rate limiting, read only from the one header our hosting platform
 * sets itself (and overwrites if a client sends it). Client-controlled headers such as
 * x-forwarded-for are never trusted. Configure with RATE_LIMIT_IP_HEADER; DigitalOcean
 * App Platform sets do-connecting-ip. Without it, all requests share one bucket.
 */
export const clientIp = (headers: Headers, trustedHeader = process.env.RATE_LIMIT_IP_HEADER || 'do-connecting-ip') =>
  headers.get(trustedHeader)?.trim() || 'unknown'
