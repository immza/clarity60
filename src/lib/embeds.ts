/**
 * Social posts that can be embedded in an article. Each one is shown as a plain card
 * first and loads the platform's own player (and its cookies) only when the reader asks.
 */
export type EmbedPlatform = 'x' | 'instagram' | 'youtube' | 'tiktok'

export type Embed = {
  platform: EmbedPlatform
  /** Platform name for labels, e.g. "Load post from X". */
  name: string
  /** Canonical link to the original post, for the "View on …" link. */
  url: string
  /** The platform's embeddable player. */
  src: string
  /** Account handle when the link contains one, e.g. "RT_com". */
  handle?: string
  /** Shape of the player: tall posts or a 16:9 video. */
  shape: 'post' | 'video' | 'vertical'
}

/** Hosts the players load from; the Content-Security-Policy allows exactly these. */
export const EMBED_FRAME_HOSTS = [
  'https://platform.twitter.com',
  'https://www.instagram.com',
  'https://www.youtube-nocookie.com',
  'https://www.tiktok.com',
]

export const SUPPORTED_EMBEDS = 'X (Twitter), Instagram, YouTube or TikTok'

const ID = /^[\w-]+$/

/** Reads a pasted post link. Returns null for anything that isn't a supported post. */
export const parseEmbed = (input: string | null | undefined): Embed | null => {
  let url: URL
  try {
    url = new URL((input ?? '').trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.replace(/^(www|mobile|m)\./, '')
  const parts = url.pathname.split('/').filter(Boolean)

  if (host === 'x.com' || host === 'twitter.com') {
    // /{handle}/status/{id}
    const [handle, status, id] = parts
    if (!/^\w+$/.test(handle ?? '') || status !== 'status' || !/^\d+$/.test(id ?? '')) return null
    return {
      platform: 'x',
      name: 'X',
      url: `https://x.com/${handle}/status/${id}`,
      src: `https://platform.twitter.com/embed/Tweet.html?id=${id}&dnt=true`,
      handle: handle === 'i' ? undefined : handle, // x.com/i/status/… links carry no handle
      shape: 'post',
    }
  }

  if (host === 'instagram.com') {
    // /p/{code}, /reel/{code}, /reels/{code}, /tv/{code}, optionally after /{handle}
    const i = parts.findIndex((p) => ['p', 'reel', 'reels', 'tv'].includes(p))
    const code = i >= 0 ? parts[i + 1] : undefined
    if (!code || !ID.test(code)) return null
    const kind = parts[i] === 'p' ? 'p' : parts[i] === 'tv' ? 'tv' : 'reel'
    return {
      platform: 'instagram',
      name: 'Instagram',
      url: `https://www.instagram.com/${kind}/${code}/`,
      src: `https://www.instagram.com/${kind}/${code}/embed/captioned/`,
      handle: i === 1 ? parts[0] : undefined,
      shape: 'post',
    }
  }

  if (host === 'youtube.com' || host === 'youtu.be') {
    let id: string | null | undefined
    let vertical = false
    if (host === 'youtu.be') id = parts[0]
    else if (parts[0] === 'watch') id = url.searchParams.get('v')
    else if (['shorts', 'embed', 'live'].includes(parts[0] ?? '')) {
      id = parts[1]
      vertical = parts[0] === 'shorts'
    }
    // YouTube video ids are always 11 characters.
    if (!id || !/^[\w-]{11}$/.test(id)) return null
    return {
      platform: 'youtube',
      name: 'YouTube',
      url: vertical ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      src: `https://www.youtube-nocookie.com/embed/${id}`,
      shape: vertical ? 'vertical' : 'video',
    }
  }

  if (host === 'tiktok.com') {
    // /@{handle}/video/{id}. Short vm.tiktok.com links hide the id, so they are not accepted.
    const [handle, video, id] = parts
    if (!handle?.startsWith('@') || video !== 'video' || !/^\d+$/.test(id ?? '')) return null
    return {
      platform: 'tiktok',
      name: 'TikTok',
      url: `https://www.tiktok.com/${handle}/video/${id}`,
      src: `https://www.tiktok.com/player/v1/${id}`,
      handle: handle.slice(1),
      shape: 'vertical',
    }
  }

  return null
}
