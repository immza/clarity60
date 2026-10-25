# Clarity60

**The world, explained.** A retro-newspaper news and explainers site at [clarity60.com](https://clarity60.com).

Built with Next.js 16 + Payload CMS 3, Postgres (Supabase), Cloudflare, ImageKit and Sentry.
See [`docs/SPEC.md`](docs/SPEC.md) for the product spec and [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) for the build plan.

## Local development

Requires Node 24.22.1+ (see `.nvmrc`).

```bash
npm install
cp .env.example .env        # then set PAYLOAD_SECRET
npm run db:local            # terminal 1: local Postgres 17, no Docker needed
npm run dev                 # terminal 2: http://localhost:3000, admin at /admin
```

## Checks

```bash
npm run typecheck
npm run lint
npm run test:int
npm run build
```

CI runs these plus a secret scan on every pull request.

## Security

Never commit `.env` or any key. Report vulnerabilities privately via GitHub Security Advisories on this repo.
