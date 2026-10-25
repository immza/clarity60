import { SITE_URL } from './schema'

/**
 * Tells Bing, Yandex, Seznam and other IndexNow engines about a new or changed URL
 * within seconds of publishing. Google does not use IndexNow; it reads our sitemaps.
 * No-op unless INDEXNOW_KEY is set and we are on the real domain.
 */
export const pingIndexNow = async (paths: string[]) => {
  const key = process.env.INDEXNOW_KEY
  if (!key || !SITE_URL.startsWith('https://') || !paths.length) return
  const host = new URL(SITE_URL).host
  await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${SITE_URL}/indexnow-key.txt`,
      urlList: paths.map((p) => `${SITE_URL}${p}`),
    }),
    signal: AbortSignal.timeout(5000),
  })
}
