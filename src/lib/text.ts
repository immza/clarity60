/** URL-safe slug: lowercase ASCII, words joined by hyphens. */
export const slugify = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 96)
    .replace(/^-+|-+$/g, '')

type LexicalNode = { type?: string; text?: string; children?: LexicalNode[] }

/** Counts words in a Lexical rich-text value by walking its text nodes. */
export const countWords = (richText: unknown): number => {
  const root = (richText as { root?: LexicalNode } | null)?.root
  if (!root) return 0
  let words = 0
  const walk = (node: LexicalNode) => {
    if (typeof node.text === 'string') {
      words += node.text.split(/\s+/).filter(Boolean).length
    }
    node.children?.forEach(walk)
  }
  walk(root)
  return words
}

// Assumption (see docs/SPEC.md): one "column inch" per 150 words; 230 words/min reading speed.
export const WORDS_PER_COLUMN_INCH = 150
export const WORDS_PER_MINUTE = 230

export const columnInchesFor = (words: number) =>
  words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_COLUMN_INCH))

export const readingMinutesFor = (words: number) =>
  words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))

type RichNode = {
  type?: string
  fields?: { sponsored?: boolean; linkType?: string; doc?: { relationTo?: string } | null; blockType?: string }
  children?: RichNode[]
}

/** True when the body links to an affiliate link, has a sponsored link, or a "Recommended" block. */
export const hasAffiliateContent = (richText: unknown): boolean => {
  const root = (richText as { root?: RichNode } | null)?.root
  if (!root) return false
  const walk = (node: RichNode): boolean => {
    const f = node.fields
    if (f?.sponsored) return true
    if (f?.linkType === 'internal' && f.doc?.relationTo === 'affiliate-links') return true
    if (node.type === 'block' && f?.blockType === 'product') return true
    return node.children?.some(walk) ?? false
  }
  return walk(root)
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

/**
 * Clean upload file name: "Twitch streamer scammed" (image/jpeg) → "twitch-streamer-scammed.jpg".
 * Lowercase, hyphens, no spaces, and the extension always matches the actual file type.
 */
export const tidyUploadName = (name: string, mimeType: string) => {
  const ext = EXTENSIONS[mimeType]
  const base = name.replace(/\.[a-z0-9]{2,5}$/i, '')
  const slug = slugify(base) || 'image'
  return ext ? `${slug}.${ext}` : slug
}
