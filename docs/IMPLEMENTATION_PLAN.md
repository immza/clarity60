# Clarity60 — Implementation Plan

See `SPEC.md` for what we're building and why. This file covers order of work.
Each milestone ends in something deployable. Tasks marked **[YOU]** need your accounts or decisions.

---

## Milestone 0: Accounts and foundations (day 1)

### [YOU] Create or prepare these accounts
Enable 2FA on every account.

- **Namecheap**
  - Turn on auto-renew and domain lock.
  - Consider a multi-year renewal.
- **GitHub:** create a public repo `clarity60`.
  - Enable Dependabot, CodeQL, secret scanning and push protection.
- **CodeRabbit:** install it on the repo.
- **Cloudflare:** add `clarity60.com` and switch Namecheap's nameservers to Cloudflare.
- **Cloudflare R2:** create two buckets, `clarity60-media` and `clarity60-backups`.
- **Supabase:** create project `clarity60-prod` in a region near the DigitalOcean region.
- **DigitalOcean:** App Platform (billing only for now).
- **ImageKit:** create an account and attach R2 as an external origin.
- **Sentry:** create a Next.js project.
- **Google:** set up Search Console (domain property via Cloudflare DNS) and a GA4 property.

### [ME] Build the foundations
- **Scaffold:** Next.js 16.4.2 + Payload 3.91.0, TypeScript strict, Node 24, pnpm.
- **Tooling:** ESLint, Prettier, Vitest, Playwright, gitleaks pre-commit hook.
- **CI on GitHub Actions**
  - Gates: install, typecheck, lint, test, build, gitleaks.
  - Lighthouse CI runs as a report only.
- **Configuration:** `.env.example` documenting every variable. Secrets live only in DigitalOcean and GitHub settings.
- **Deployment:** first deploy to DigitalOcean, with the Cloudflare proxy, SSL mode "Full (strict)", and the custom domain.
  - **Exit check:** the admin login works over HTTPS.
  - This resolves open risk #1.

---

## Milestone 1: CMS core (days 2–3)

- **Collections:** Users (staff), Authors, Categories, Tags, Media, Articles, Pages, Corrections, Redirects, AdSlots.
- **Globals:** SiteSettings.
- **Roles and access control**
  - Super Admin / Editor / Writer enforced in Payload `access` functions.
  - Unit tests for every collection × role.
- **Login security:** staff 2FA (TOTP) required, plus login rate limiting.
- **Workflow:** drafts and versions; draft → in review → scheduled → published.
  - Writers cannot publish.
  - Scheduled publishing runs through the Payload Jobs Queue.
- **Editor:** Lexical with headings, quotes, image, video, embed (link card), callout, table and a raw HTML block (Editors and above only).
- **Article hooks**
  - Compute word count, column inches and reading minutes.
  - Auto-create a redirect when the category or slug changes.
  - Revalidate cache tags on publish.
  - Ping IndexNow.
- **Media rules**
  - Alt text and credit are required.
  - Uploads go to R2 and are delivered through ImageKit URLs.
- **Audit log:** a hook on create, update, delete and publish across collections.
- **Seed script:** the 6 regions, 9 explainer subjects, the "Clarity60 Desk" author, and default ad slots set to off.

**Exit check:** you can write, schedule and publish an article from the admin panel.

---

## Milestone 2: Design system and layout (days 3–5)

- **[ME → YOU]** A masthead and header mockup with the Morning/Night Edition toggle. You approve it before it's built.
- **Design tokens** taken from the PDF: paper, ink, the accent blue, rules (divider lines), and the hatched image placeholder.
  - Light and dark themes.
  - No flash of the wrong theme on load.
- **Fonts:** self-hosted and subset, with `font-display: swap`. The display, serif and condensed sans faces match the PDF.
- **Shared components**
  - Masthead and header, plus a compact sticky header on inner pages.
  - Nav, The Wire ticker, footer and corrections box.
  - Story cards in list, grid and feature variants.
  - Section tabs, pagination, Load More, Most Read, ad slot.
- **Ad slots:** fixed reserved dimensions so ads never shift the layout, rendered according to the CMS mode.
- **Responsive and accessible:** checked at phone, tablet and desktop widths, and to WCAG 2.2 AA in both themes.

---

## Milestone 3: Public pages (days 5–8)

- **Front Page:** The Latest, the lead explainer, the Latest feed with an in-feed ad every N stories, Most Read and a sidebar ad.
- **Section indexes:** World News with region tabs, a top story and a Developing block; Explainers with the subject desk grid, a featured story and a grid.
- **Category pages**, each paginated with crawlable `?page=` links.
- **Article page**
  - Breadcrumb, headline, summary, hero image with credit, byline and dates, and body.
  - Sources (news), the Developing timeline, a related explainer, tags and related stories.
- **Other pages:** tag pages, author pages and static pages.
- **Search** using Postgres full-text search.
- **Most Read:** a lightweight view beacon writes to `ArticleViewsDaily`, which is aggregated hourly.
- **Errors:** custom 404 and 500 pages, and redirect resolution in middleware.

---

## Milestone 4: SEO/GEO, legal and analytics (days 8–9)

- **Structured data:** JSON-LD on every page type, validated in tests with schema assertions.
- **Sitemaps and feeds**
  - Sitemap index with monthly section sitemaps.
  - Google News sitemap covering the last 48 hours.
  - RSS per section.
- **Crawler files and metadata:** `robots.txt`, `llms.txt`, canonicals, OG/Twitter cards and generated OG images.
- **Legal pages:** About, Contact (Resend), Privacy, Cookies, Terms and Advertise.
- **Consent and analytics:** a Google-certified cookie banner with Consent Mode v2, then GA4 behind the consent.
- **Search engines:** submit sitemaps to Search Console and Bing Webmaster Tools.

---

## Milestone 5: Hardening and launch (days 9–10)

- **Security headers:** CSP, HSTS, Permissions-Policy, frame-ancestors.
- **Cloudflare**
  - Firewall rules and rate limits on the admin, search and API routes.
  - Bot Fight Mode.
  - Cache rules: HTML for public routes, with bypass for the admin and preview.
- **Sentry:** server and client error tracking, plus a release per deploy.
- **Uptime monitor** on the home page and one article.
- **Backups:** a nightly `pg_dump` to R2, plus a weekly offsite copy, and a **tested restore**.
- **Supabase keep-alive** job.
- **Pre-launch check:** Lighthouse on the 5 key templates, the Rich Results Test, an axe accessibility pass, and a restore drill.
- **🚀 Launch.** Then publish consistently.

---

## Phase 2: Readers (about 1–2 weeks after launch)

- **Reader sign-in:** Supabase Auth with Google, Facebook and Apple.
  - **[YOU]** Set up the Meta app review and the Apple Services ID.
- **ReaderProfiles:** created on first login.
- **Comments, Reports and Saves:** all reader tables protected by RLS.
- **Comments**
  - Lazy-loaded at the bottom of the article and excluded from schema.
  - Spam and abuse filter; a reader's first comment is held; rate limits.
  - Replies at unlimited depth, with indentation capped at 4.
- **Moderation queue** in the admin panel, with email alerts.
- **Reply-notification emails** with one-click opt-out, plus a "My saved articles" page.

## Phase 3

- Newsreel through the Instagram Graph API, via a scheduled job, as a static grid.
- Newsletter (Sunday Edition), Puzzles and Back Issues.
- Apply for AdSense and switch slot modes on.

---

## Definition of done (per milestone)

- CI gates pass, and CodeRabbit comments are addressed.
- The milestone is deployed to production behind Cloudflare.
- Guideline metrics are reported, and any regressions are noted in the PR.
