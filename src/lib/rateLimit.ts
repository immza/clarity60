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

/** Cloudflare's published edge ranges (cloudflare.com/ips-v4 and /ips-v6, 2026-10-31). */
const CLOUDFLARE_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
  '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
  '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
  '2a06:98c0::/29', '2c0f:f248::/32',
]

/** An IP address as a number plus its width in bits, or null if it isn't a plain address. */
const parseIp = (ip: string): { value: bigint; bits: 32 | 128 } | null => {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const parts = ip.split('.').map(Number)
    if (parts.some((p) => p > 255)) return null
    return { value: parts.reduce((n, p) => (n << 8n) | BigInt(p), 0n), bits: 32 }
  }
  if (!/^[0-9a-f:]{2,39}$/i.test(ip)) return null
  const halves = ip.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - tail.length
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...tail]
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null
  return { value: groups.reduce((n, g) => (n << 16n) | BigInt(parseInt(g, 16)), 0n), bits: 128 }
}

const cloudflareNets = CLOUDFLARE_RANGES.map((cidr) => {
  const [base, prefix] = cidr.split('/')
  const ip = parseIp(base)!
  return { ...ip, prefix: BigInt(prefix) }
})

const isCloudflare = (ip: string) => {
  const parsed = parseIp(ip)
  return (
    !!parsed &&
    cloudflareNets.some((net) => {
      if (net.bits !== parsed.bits) return false
      const shift = BigInt(net.bits) - net.prefix
      return parsed.value >> shift === net.value >> shift
    })
  )
}

/**
 * The visitor IP for rate limiting, read only from the one header our hosting platform
 * sets itself (and overwrites if a client sends it). Client-controlled headers such as
 * x-forwarded-for are never trusted. Configure with RATE_LIMIT_IP_HEADER; DigitalOcean
 * App Platform sets do-connecting-ip. Without it, all requests share one bucket.
 *
 * Behind the Cloudflare proxy that header holds Cloudflare's address, shared by many
 * readers. Only then is Cloudflare's cf-connecting-ip used: a request sent straight to
 * the app can't come from a Cloudflare address, so it can't fake the header.
 */
export const clientIp = (headers: Headers, trustedHeader = process.env.RATE_LIMIT_IP_HEADER || 'do-connecting-ip') => {
  const peer = headers.get(trustedHeader)?.trim()
  if (!peer) return 'unknown'
  const visitor = headers.get('cf-connecting-ip')?.trim()
  return visitor && parseIp(visitor) && isCloudflare(peer) ? visitor : peer
}
