import type { MetadataRoute } from 'next'

import { absolute } from '@/lib/schema'

/**
 * Open to search engines and AI assistants (being cited is the goal). Only tracking
 * links and the API are off-limits. The admin panel sends its own noindex.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/go/', '/api/'] }],
    sitemap: [absolute('/sitemap.xml'), absolute('/news-sitemap.xml')],
  }
}
