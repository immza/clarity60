# Clarity60 — v1 Spec

> "The world, explained." · clarity60.com · Instagram @theclarity60
> Agreed: 2026-10-21. Source design: `Clarity60 Website.pdf` (retro newspaper, light + dark).

## 1. Product

- A newspaper-style publication with two kinds of content: **World News** and evergreen **Explainers**.
- **Primary goal:** rank in search and get cited by AI engines (SEO + GEO). That means fast pages, cheap to crawl, with perfect structured data.
- **Content:** humans write and publish everything. AI is a research and planning aid only. Volume is 1–5 posts a day. English only.
- **Staff:** a single author at launch, growing into a team with roles.

## 2. Scope

### Phase 1: Launch
- **Pages**
  - Front Page: latest news and explainers mixed.
  - World News, with region tabs.
  - Explainers, with subject tabs.
  - Category, tag, author and article pages.
  - Search.
- **Front Page modules**
  - **The Latest:** 5 newest one-liners, filled automatically (replaces Today's Brief).
  - **The Wire:** a ticker showing the latest headline per region, filled automatically.
  - **Developing story timeline** on news articles.
  - **Most Read:** sitewide and per section.
  - **Corrections box.**
- **Look and layout:** Morning / Night Edition theme toggle (light / dark), with a redesigned masthead and header.
- **Legal and info pages:** About, Contact, Privacy, Cookies, Terms, Advertise.
- **Cookie consent:** a Google-certified consent banner (CMP).
- **Ads:** ad slots ship switched **off**. Each slot is controlled from the CMS: Off / AdSense / Direct.
- **Analytics:** GA4 and Google Search Console.
- **Payload CMS:** roles, 2FA, drafts → review → publish/schedule, audit log, redirects manager.

### Phase 2: Readers (about 1–2 weeks after launch)
- Reader sign-in with Google, Facebook and Apple, via Supabase Auth.
- Threaded comments. Depth is unlimited in data; the visual indent stops at level 4.
- Save favourites.
- Report comment, plus a moderation queue.
- Transactional email via Resend:
  - contact form
  - moderation alerts
  - reply notifications (opt-out)
  - staff invites

### Phase 3
- **Newsreel:** a background job pulls reels via the Instagram Graph API and shows them as a static image grid linking out. No embed script.
- Newsletter, Puzzles, Back Issues.
- Switch on AdSense once there are about 30 posts.

### Out of scope for v1
Today's Brief, Quickest Reads, AI-generated publishing, other languages, paid subscriptions.

## 3. Information architecture and URLs

| Path | Content |
|---|---|
| `/` | Front Page |
| `/news` | All news |
| `/news/{region}` | Asia, Europe, Americas, Africa, Middle East, Oceania |
| `/news/{region}/{slug}` | News article |
| `/explainers` | All explainers |
| `/explainers/{subject}` | History, Geography, Science, Psychology, Space, Crime Stories, Odd Spot, How-Tos, Self-Improvement |
| `/explainers/{subject}/{slug}` | Explainer article |
| `/tag/{slug}`, `/author/{slug}`, `/search` | Tag, author and search pages |
| `/about`, `/contact`, `/privacy`, `/cookies`, `/terms`, `/advertise` | Static pages |

- Categories can be created from the CMS, up to 2 levels deep. Tags hold everything else.
- Each article has exactly one primary category, and that category sets its URL.
- Changing an article's category or slug automatically creates a 301 redirect from the old URL.

## 4. Roles

| Role | Can |
|---|---|
| Super Admin (many allowed) | Everything: staff, roles, categories, ad slots, settings, redirects, audit log |
| Editor | Write unlimited posts, edit and publish anything, moderate comments |
| Writer | Create drafts and submit them for review. Cannot publish. |
| Reader (Supabase Auth, Phase 2) | Comment, reply, save, report |

- 2FA is mandatory for all staff.
- Readers and staff are separate identity systems. A reader account can never reach the admin.

## 5. Data model (Supabase Postgres; Payload owns the schema via migrations)

### Articles
- **Identity:** `section` (→ Sections), `title`, `slug` (unique per section), `summary`.
- **Media and body:** `heroMedia` (image or video), `body` (Lexical rich text).
- **Classification:** `category` (primary, required), `tags[]`, `authors[]`, `bylineOverride` (e.g. "Clarity60 Desk").
- **Workflow:** `status` (draft | in_review | scheduled | published), `publishedAt`, `updatedAt`.
- **Computed:** `wordCount`, `columnInches`, `readingMinutes`.
- **Placement:** `featured`, `topStory`.
- **News only:** `sources[]` (outlet and URL), `developingUpdates[]` (timestamp and text), `relatedExplainer`, `instagramUrl`.
- **SEO:** `metaTitle`, `metaDescription`, `ogImage`, `canonical`, `noindex`.

### Structure is data, not code
Sections, categories, sub-categories and navigation are all edited in the admin; adding a desk
(e.g. Business) or a sub-category needs no code change.

- **Sections:** `name`, `slug` (reserved words blocked), `kind` (news | evergreen → schema type and
  Google News sitemap), `kicker`, `description`, `showInNav`, `sortOrder`, `previousSlugs`.
- **Renames are safe:** renaming a section or category, or moving a sub-category, records the old slug,
  queues a background job that refreshes every affected article URL, and old links 301 to the new ones.

### Supporting collections
- **Categories:** `section` (→ Sections), `parent?`, `name`, `slug`, `description`, `sortOrder`, `previousSlugs`.
- **Tags:** `name`, `slug`, `description`.
- **Authors:** schema `Person`. Fields: `name`, `slug`, `bio`, `credentials`, `socials`, `photo`, `staffUser?`.
- **Media:** `file`, `alt` (required), `credit` (required), `license`.
- **Redirects:** `from`, `to`, `type`, `auto`.
- **Corrections:** `article`, `text`, `date`.
- **Pages:** static pages.
- **AdSlots:** `key`, `mode` (off | adsense | direct), `size`, `adsenseSlotId`, `creative`, `link`.
- **SiteSettings:** a global holding extra nav links, socials, tagline, and in-feed ad frequency (default every 6 stories).
- **AuditLog** and **ArticleViewsDaily** (`article`, `date`, `count`).

### Phase 2 additions
- **ReaderProfiles:** `supabaseUserId`, `displayName`, `avatar`, `trusted`, `banned`.
- **Comments:** `article`, `reader`, `parent?`, `body`, `status` (visible | held | hidden | removed), timestamps.
- **Reports:** `comment`, `reader`, `reason`.
- **Saves:** unique on (`reader`, `article`).

## 6. Architecture

- **App:** Next.js 16.4.2 (App Router) with Payload 3.91.0 in the same app, running on Node 24.
- **Hosting:** DigitalOcean App Platform, one 1 GiB container at $10/mo flat, autoscaling off.
- **Edge:** Cloudflare free plan in front.
  - DNS, CDN cache for HTML and assets, WAF, rate limiting, bot protection, DDoS protection.
  - Hides the origin server.
- **Rendering:** public pages are statically generated or cached, then revalidated on publish by tag through a Payload `afterChange` hook.
  - Minimal client JavaScript; fonts are self-hosted.
- **Database:** Supabase Postgres via `@payloadcms/db-postgres`, using the pooled connection.
- **Media:** files are stored in Cloudflare R2 via `@payloadcms/storage-s3` and delivered via ImageKit (AVIF/WebP, responsive sizes, lazy loading).
- **Background jobs:** Payload Jobs Queue plus scheduled triggers.
  - scheduled publishing
  - daily database keep-alive
  - nightly `pg_dump` to R2 and an offsite copy
- **Search:** Postgres full-text search behind a `search` module that can be swapped out.
- **Reader auth (Phase 2):** Supabase Auth. API routes verify the Supabase JWT, and row-level security (RLS) applies to reader tables.

## 7. SEO and GEO

- **Structured data:** JSON-LD for `NewsArticle` / `Article`, `BreadcrumbList`, `Organization`, `Person`, and `WebSite` + `SearchAction`. Comments are excluded from structured data.
- **Sitemaps:** a sitemap index split by section and month, plus a Google News sitemap covering the last 48 hours.
- **Feeds and crawler files:** RSS per section, `robots.txt` (AI crawlers allowed), `llms.txt`.
- **Page metadata:** canonical URLs, Open Graph and Twitter cards.
- **IndexNow** ping on every publish.
- Semantic HTML, a breadcrumb on every article, and visible author bylines with dates (E-E-A-T).

## 8. Quality, security, observability

- **Hard CI gates:** build, typecheck, lint, secret scan.
- **Guidelines (reported, not blocking):**
  - LCP < 2.5s, CLS < 0.1, INP < 200ms
  - Lighthouse SEO and Accessibility ≥ 95
  - WCAG 2.2 AA
  - valid schema
- **Tests:** Vitest (units, access control), Playwright (critical flows), Lighthouse CI report on each PR.
- **Code checks:** CodeRabbit, GitHub CodeQL, Dependabot, secret push protection, gitleaks.
- **Security**
  - Headers: CSP, HSTS, frame-ancestors, referrer policy.
  - Cloudflare WAF and rate limits.
  - Admin route set from an environment variable.
  - Mandatory staff 2FA and an audit log.
  - Least-privilege API keys and RLS.
- **Monitoring:** Sentry (errors and performance), GA4, Search Console, Cloudflare analytics, a free uptime monitor.

## 9. Environments and cost

- **Environments:** local, preview (one per PR, with its own database branch or seed), production.
- **Cost:** about **$10/mo** (DigitalOcean) plus the domain. Supabase, Cloudflare, R2, ImageKit, Sentry, CodeRabbit (public repo), Resend and GA4 are all on free tiers.

## 10. Assumptions

1. Column inches and reading time are computed from word count: 1 column inch per 150 words, 230 words per minute.
2. Comment depth is unlimited in data; the visual indent is capped at level 4.
3. Slugs are unique per section.
4. Each article has one primary category, plus tags.
5. `robots.txt` allows AI crawlers: GPTBot, ClaudeBot, PerplexityBot, Google-Extended.
6. Video is hosted on ImageKit rather than embedded from YouTube.
7. The front page follows the PDF minus Puzzles and Today's Brief. The new masthead is mocked up for approval before it is built.
8. The uptime monitor is a free service (e.g. UptimeRobot).
9. Email is sent via Resend from a `clarity60.com` subdomain.

## 11. Open risks

1. Our own Cloudflare proxy in front of DigitalOcean App Platform (which already sits on Cloudflare) needs correct SSL and custom-domain settings. Verify this during Phase 0.
2. Payload may need more than 1 GiB of RAM under load. Monitor it; the next size is $25/mo.
3. Supabase free tier pauses after 7 days of DB inactivity and has a 500 MB cap. Mitigations: keep-alive job and backups. The paid plan is $25/mo.
4. The ImageKit free bandwidth cap is likely the first limit we hit. Fallback: Cloudflare Images on top of R2.
5. The 1–2 week launch is only realistic with a frozen Phase 1 scope.
6. The domain is registered for 1 year only. Enable auto-renew, 2FA and domain lock now.
7. AdSense approval needs real content volume.
8. Facebook login needs Meta app review before Phase 2.
9. Image licensing: the credit field must be filled honestly.
