import { describe, expect, it } from 'vitest'

import { parseEmbed } from '@/lib/embeds'
import { securityHeaders } from '@/lib/securityHeaders'

describe('embedded posts', () => {
  it('reads X / Twitter post links', () => {
    const e = parseEmbed('https://twitter.com/RT_com/status/1984123456789012345?s=20')
    expect(e).toMatchObject({
      platform: 'x',
      handle: 'RT_com',
      url: 'https://x.com/RT_com/status/1984123456789012345',
      src: 'https://platform.twitter.com/embed/Tweet.html?id=1984123456789012345&dnt=true',
    })
    expect(parseEmbed('https://mobile.x.com/RT_com/status/1')?.platform).toBe('x')
  })

  it('reads Instagram posts and reels, with or without the handle', () => {
    expect(parseEmbed('https://www.instagram.com/p/DfE71pPBJqP/?igsh=abc')).toMatchObject({
      platform: 'instagram',
      src: 'https://www.instagram.com/p/DfE71pPBJqP/embed/captioned/',
    })
    expect(parseEmbed('https://instagram.com/reels/Cx9_a-1/')?.src).toBe('https://www.instagram.com/reel/Cx9_a-1/embed/captioned/')
    expect(parseEmbed('https://www.instagram.com/deannaskitchensg/reel/Cx9a1/')?.handle).toBe('deannaskitchensg')
  })

  it('reads YouTube videos, short links and Shorts', () => {
    expect(parseEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toMatchObject({
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      shape: 'video',
    })
    expect(parseEmbed('https://youtu.be/dQw4w9WgXcQ?si=x')?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(parseEmbed('https://youtube.com/shorts/abcDEF12345')?.shape).toBe('vertical')
  })

  it('reads full TikTok video links', () => {
    expect(parseEmbed('https://www.tiktok.com/@someone/video/7312345678901234567?lang=en')).toMatchObject({
      platform: 'tiktok',
      handle: 'someone',
      src: 'https://www.tiktok.com/player/v1/7312345678901234567',
    })
  })

  it('rejects anything that is not a single supported post', () => {
    for (const bad of [
      '',
      'not a url',
      'javascript:alert(1)',
      'https://x.com/RT_com',
      'https://x.com/RT_com/status/abc',
      'https://www.instagram.com/deannaskitchensg/',
      'https://www.youtube.com/@channel',
      'https://youtu.be/abc',
      'https://vm.tiktok.com/ZMabc123/',
      'https://example.com/p/abc',
      'https://x.com.evil.com/a/status/1',
    ])
      expect(parseEmbed(bad), bad).toBeNull()
  })

  it('lets the players load in frames, and nothing else new', () => {
    const csp = securityHeaders.find((h) => h.key === 'Content-Security-Policy')!.value
    const frameSrc = csp.split('; ').find((d) => d.startsWith('frame-src'))
    expect(frameSrc).toBe(
      "frame-src 'self' https://platform.twitter.com https://www.instagram.com https://www.youtube-nocookie.com https://www.tiktok.com",
    )
    expect(csp).toContain("frame-ancestors 'none'")
  })
})
