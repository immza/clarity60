import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import type { Article, Category, Section, User } from '@/payload-types'

let payload: Payload
let superAdmin: User
let editor: User
let writer: User
let otherWriter: User
let newsSection: Section
let explainersSection: Section
let asia: Category
let europe: Category
let history: Category

const body = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: [{ type: 'text', text, version: 1, format: 0, mode: 'normal', style: '', detail: 0 }],
      },
    ],
  },
})

const asUser = (user: User) => ({ user: { ...user, collection: 'users' as const }, overrideAccess: false })

let counter = 0
const draftArticle = (user: User, overrides: Partial<Article> = {}) =>
  payload.create({
    collection: 'articles',
    draft: true,
    data: {
      title: `Test story ${++counter}`,
      summary: 'A summary.',
      section: newsSection.id,
      category: asia.id,
      body: body('one two three four five'),
      _status: 'draft',
      ...overrides,
    } as Article,
    ...asUser(user),
  })

const makeUser = (email: string, role: User['role']) =>
  payload.create({
    collection: 'users',
    data: { email, password: 'correct-horse-battery-staple', name: email, role },
    overrideAccess: true,
  })

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  superAdmin = await makeUser('super@test.dev', 'super-admin')
  editor = await makeUser('editor@test.dev', 'editor')
  writer = await makeUser('writer@test.dev', 'writer')
  otherWriter = await makeUser('writer2@test.dev', 'writer')

  newsSection = await payload.create({
    collection: 'sections',
    data: { name: 'World News', slug: 'news', kind: 'news' },
    overrideAccess: true,
  })
  explainersSection = await payload.create({
    collection: 'sections',
    data: { name: 'Explainers', slug: 'explainers', kind: 'evergreen' },
    overrideAccess: true,
  })
  const cat = (name: string, slug: string, section: Section) =>
    payload.create({ collection: 'categories', data: { name, slug, section: section.id }, overrideAccess: true })
  asia = await cat('Asia', 'asia', newsSection)
  europe = await cat('Europe', 'europe', newsSection)
  history = await cat('History', 'history', explainersSection)
})

describe('roles', () => {
  it('a writer can create a draft, which records the author and computed fields', async () => {
    const doc = await draftArticle(writer, { title: 'Why Tokyo Has So Many Vending Machines' })
    const createdBy = typeof doc.createdBy === 'object' ? doc.createdBy?.id : doc.createdBy
    expect(createdBy).toBe(writer.id)
    expect(doc.slug).toBe('why-tokyo-has-so-many-vending-machines')
    expect(doc.path).toBe('/news/asia/why-tokyo-has-so-many-vending-machines')
    expect(doc.wordCount).toBe(5)
    expect(doc.columnInches).toBe(1)
    expect(doc.readingMinutes).toBe(1)
  })

  it('a writer cannot publish, on create or on update', async () => {
    // The admin "Publish" button saves without draft mode.
    await expect(
      payload.create({
        collection: 'articles',
        data: {
          title: 'Sneaky publish',
          slug: '',
          summary: 'A summary.',
          section: newsSection.id,
          category: asia.id,
          body: body('text'),
          _status: 'published',
        },
        ...asUser(writer),
      }),
    ).rejects.toThrow()

    const doc = await draftArticle(writer)
    await expect(
      payload.update({ collection: 'articles', id: doc.id, data: { _status: 'published' }, ...asUser(writer) }),
    ).rejects.toThrow()
  })

  it('a writer cannot edit another writer’s article', async () => {
    const doc = await draftArticle(otherWriter)
    await expect(
      payload.update({ collection: 'articles', id: doc.id, data: { title: 'Hijacked' }, draft: true, ...asUser(writer) }),
    ).rejects.toThrow()
  })

  it('an editor can publish, which stamps publishedAt', async () => {
    const doc = await draftArticle(writer)
    const published = await payload.update({
      collection: 'articles',
      id: doc.id,
      data: { _status: 'published' },
      ...asUser(editor),
    })
    expect(published._status).toBe('published')
    expect(published.publishedAt).toBeTruthy()
  })

  it('only a super admin can change roles', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { role: 'super-admin' },
      ...asUser(editor),
    })
    expect(updated.role).toBe('editor')

    const promoted = await payload.update({
      collection: 'users',
      id: writer.id,
      data: { role: 'editor' },
      ...asUser(superAdmin),
    })
    expect(promoted.role).toBe('editor')
    await payload.update({ collection: 'users', id: writer.id, data: { role: 'writer' }, overrideAccess: true })
  })

  it('a writer cannot change or unpublish their own article once it is live', async () => {
    const doc = await draftArticle(writer, { title: 'Writer Story Gone Live' })
    await payload.update({ collection: 'articles', id: doc.id, data: { _status: 'published' }, ...asUser(editor) })

    // Omitted _status (Payload would write the main doc as a draft) and explicit draft both refused.
    await expect(
      payload.update({ collection: 'articles', id: doc.id, data: { title: 'Changed live' }, ...asUser(writer) }),
    ).rejects.toThrow()
    await expect(
      payload.update({ collection: 'articles', id: doc.id, data: { _status: 'draft' }, ...asUser(writer) }),
    ).rejects.toThrow()

    const live = await payload.findByID({ collection: 'articles', id: doc.id })
    expect(live._status).toBe('published')
    expect(live.title).toBe('Writer Story Gone Live')
  })

  it('writers cannot delete articles or create staff accounts', async () => {
    const doc = await draftArticle(writer)
    await expect(payload.delete({ collection: 'articles', id: doc.id, ...asUser(writer) })).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'x@test.dev', password: 'correct-horse-battery-staple', name: 'X', role: 'writer' },
        ...asUser(writer),
      }),
    ).rejects.toThrow()
  })
})

describe('public visibility', () => {
  it('anonymous visitors see published articles but never drafts', async () => {
    const draft = await draftArticle(writer, { title: 'Secret draft' })
    const live = await draftArticle(writer, { title: 'Live story' })
    await payload.update({ collection: 'articles', id: live.id, data: { _status: 'published' }, ...asUser(editor) })

    const result = await payload.find({ collection: 'articles', overrideAccess: false, limit: 100 })
    const ids = result.docs.map((d) => d.id)
    expect(ids).toContain(live.id)
    expect(ids).not.toContain(draft.id)
  })

  it('anonymous visitors cannot read staff accounts or the audit log', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
    await expect(payload.find({ collection: 'audit-log', overrideAccess: false })).rejects.toThrow()
  })
})

describe('urls', () => {
  it('rejects a duplicate slug in the same section but allows it in another', async () => {
    await draftArticle(editor, { title: 'Same Title' })
    await expect(draftArticle(editor, { title: 'Same Title' })).rejects.toThrow()
    const explainer = await draftArticle(editor, { title: 'Same Title', section: explainersSection.id, category: history.id })
    expect(explainer.path).toBe('/explainers/history/same-title')
  })

  it('rejects a category from the wrong section', async () => {
    await expect(draftArticle(editor, { section: explainersSection.id, category: asia.id })).rejects.toThrow()
  })

  it('moving a published article creates a 301 from the old URL and avoids loops when moved back', async () => {
    const doc = await draftArticle(editor, { title: 'Moving Story' })
    await payload.update({ collection: 'articles', id: doc.id, data: { _status: 'published' }, ...asUser(editor) })

    await payload.update({ collection: 'articles', id: doc.id, data: { category: europe.id }, ...asUser(editor) })
    const first = await payload.find({ collection: 'redirects', where: { from: { equals: '/news/asia/moving-story' } } })
    expect(first.totalDocs).toBe(1)
    expect(first.docs[0].type).toBe('301')

    await payload.update({ collection: 'articles', id: doc.id, data: { category: asia.id }, ...asUser(editor) })
    const loop = await payload.find({ collection: 'redirects', where: { from: { equals: '/news/asia/moving-story' } } })
    expect(loop.totalDocs).toBe(0)
    const back = await payload.find({ collection: 'redirects', where: { from: { equals: '/news/europe/moving-story' } } })
    expect(back.totalDocs).toBe(1)
  })
})

describe('safe edits', () => {
  it('a title-only edit keeps the existing slug and URL', async () => {
    const doc = await draftArticle(editor, { title: 'Original Headline' })
    const renamed = await payload.update({
      collection: 'articles',
      id: doc.id,
      data: { title: 'A Better Headline' },
      draft: true,
      ...asUser(editor),
    })
    expect(renamed.slug).toBe('original-headline')
    expect(renamed.path).toBe('/news/asia/original-headline')
  })

  it('a draft (autosave) URL change only redirects once the new URL is published', async () => {
    const doc = await draftArticle(editor, { title: 'Autosaved Move' })
    await payload.update({ collection: 'articles', id: doc.id, data: { _status: 'published' }, ...asUser(editor) })

    await payload.update({ collection: 'articles', id: doc.id, data: { category: europe.id }, draft: true, ...asUser(editor) })
    const early = await payload.find({ collection: 'redirects', where: { from: { equals: '/news/asia/autosaved-move' } } })
    expect(early.totalDocs).toBe(0)

    await payload.update({
      collection: 'articles',
      id: doc.id,
      data: { category: europe.id, _status: 'published' },
      ...asUser(editor),
    })
    const after = await payload.find({ collection: 'redirects', where: { from: { equals: '/news/asia/autosaved-move' } } })
    expect(after.totalDocs).toBe(1)
  })

  it('deleting an article also removes its corrections', async () => {
    const doc = await draftArticle(editor, { title: 'Corrected Story' })
    await payload.create({ collection: 'corrections', data: { article: doc.id, text: 'Fixed a date.', date: new Date().toISOString() }, overrideAccess: true })
    await payload.delete({ collection: 'articles', id: doc.id, ...asUser(editor) })
    const left = await payload.find({ collection: 'corrections', where: { article: { equals: doc.id } } })
    expect(left.totalDocs).toBe(0)
  })
})

describe('categories', () => {
  it('a category with sub-categories cannot itself be nested', async () => {
    const geography = await payload.create({
      collection: 'categories',
      data: { name: 'Geo Parent', slug: '', section: explainersSection.id },
      overrideAccess: true,
    })
    const parentWithChild = await payload.create({
      collection: 'categories',
      data: { name: 'Has Child', slug: '', section: explainersSection.id },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'categories',
      data: { name: 'The Child', slug: '', section: explainersSection.id, parent: parentWithChild.id },
      overrideAccess: true,
    })
    await expect(
      payload.update({
        collection: 'categories',
        id: parentWithChild.id,
        data: { parent: geography.id },
        ...asUser(editor),
      }),
    ).rejects.toThrow()
  })

  it('allows two levels but not three', async () => {
    const ancient = await payload.create({
      collection: 'categories',
      data: { name: 'Ancient History', slug: '', section: explainersSection.id, parent: history.id },
      ...asUser(editor),
    })
    expect(ancient.slug).toBe('ancient-history')

    await expect(
      payload.create({
        collection: 'categories',
        data: { name: 'Rome', slug: '', section: explainersSection.id, parent: ancient.id },
        ...asUser(editor),
      }),
    ).rejects.toThrow()
  })

  it('builds article paths through the parent category', async () => {
    const sub = await payload.create({
      collection: 'categories',
      data: { name: 'Cold War', slug: '', section: explainersSection.id, parent: history.id },
      overrideAccess: true,
    })
    const doc = await draftArticle(editor, { title: 'The Berlin Airlift', section: explainersSection.id, category: sub.id })
    expect(doc.path).toBe('/explainers/history/cold-war/the-berlin-airlift')
  })
})

describe('flexible structure', () => {
  it('a new section can be added from the admin and gets its own URLs', async () => {
    const business = await payload.create({
      collection: 'sections',
      data: { name: 'Business', slug: '', kind: 'news' },
      overrideAccess: true,
    })
    const markets = await payload.create({
      collection: 'categories',
      data: { name: 'Markets', slug: '', section: business.id },
      overrideAccess: true,
    })
    const doc = await draftArticle(editor, { title: 'Why Oil Prices Moved', section: business.id, category: markets.id })
    expect(doc.path).toBe('/business/markets/why-oil-prices-moved')
  })

  it('reserved URLs cannot be used as a section', async () => {
    await expect(
      payload.create({ collection: 'sections', data: { name: 'Admin', slug: 'admin', kind: 'news' }, overrideAccess: true }),
    ).rejects.toThrow()
  })

  it('renaming a category remembers the old slug and refreshes article URLs in the background', async () => {
    const oceania = await payload.create({
      collection: 'categories',
      data: { name: 'Oceania', slug: 'oceania', section: newsSection.id },
      overrideAccess: true,
    })
    const doc = await draftArticle(editor, { title: 'Reef Report', category: oceania.id })
    await payload.update({ collection: 'articles', id: doc.id, data: { _status: 'published' }, ...asUser(editor) })

    const renamed = await payload.update({
      collection: 'categories',
      id: oceania.id,
      data: { slug: 'pacific' },
      ...asUser(editor),
    })
    expect(renamed.previousSlugs).toContain('oceania')

    await payload.jobs.run({ limit: 10 })
    const after = await payload.findByID({ collection: 'articles', id: doc.id })
    expect(after.path).toBe('/news/pacific/reef-report')
    expect(after._status).toBe('published')
  })
})

describe('audit log', () => {
  it('records who published what', async () => {
    const doc = await draftArticle(writer, { title: 'Audited Story' })
    await payload.update({ collection: 'articles', id: doc.id, data: { _status: 'published' }, ...asUser(editor) })
    const log = await payload.find({
      collection: 'audit-log',
      where: { and: [{ docId: { equals: String(doc.id) } }, { action: { equals: 'publish' } }] },
      depth: 0,
    })
    expect(log.totalDocs).toBe(1)
    expect(log.docs[0].user).toBe(editor.id)
  })
})
