/** Cache tags for public pages; Payload hooks revalidate these when content changes. */
export const TAGS = {
  sections: 'sections',
  categories: 'categories',
  articles: 'articles',
  settings: 'site-settings',
} as const
