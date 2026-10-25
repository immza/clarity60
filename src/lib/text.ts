/** URL-safe slug: lowercase ASCII, words joined by hyphens. */
export const slugify = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)

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
