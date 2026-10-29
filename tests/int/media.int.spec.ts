import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { tidyUploadName } from '@/lib/text'
import config from '@/payload.config'

let payload: Payload
const created: number[] = []

beforeAll(async () => {
  payload = await getPayload({ config: await config })
})

afterAll(async () => {
  for (const id of created) await payload.delete({ collection: 'media', id, overrideAccess: true })
})

describe('upload file names', () => {
  it('cleans names and adds the extension from the real file type', () => {
    expect(tidyUploadName('Twitch streamer scammed', 'image/jpeg')).toBe('twitch-streamer-scammed.jpg')
    expect(tidyUploadName('Photo 2026 (1).PNG', 'image/png')).toBe('photo-2026-1.png')
    expect(tidyUploadName('screenshot.jpeg', 'image/webp')).toBe('screenshot.webp')
    expect(tidyUploadName('!!!', 'image/gif')).toBe('image.gif')
  })

  it('an uploaded image is stored under the tidy name', async () => {
    const data = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#cccccc' } }).jpeg().toBuffer()
    const doc = await payload.create({
      collection: 'media',
      data: { alt: 'Test image', credit: 'Clarity60', license: 'own' },
      file: { data, mimetype: 'image/jpeg', name: 'My Test Photo', size: data.length },
      overrideAccess: true,
    })
    created.push(doc.id)
    expect(doc.filename).toBe('my-test-photo.jpg')
  })
})
