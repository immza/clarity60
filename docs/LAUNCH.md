# Launch runbook

The order of steps for taking clarity60.com live. Secrets go into dashboards only, never into git or chat.

## 1. Supabase

1. **Database connection string.** In Supabase, go to Project → **Connect** → **Session pooler** and copy the string.
   - Use the session pooler, not "Direct connection". The direct connection is IPv6-only, and DigitalOcean App Platform needs IPv4.
   - The string looks like `postgresql://postgres.<ref>:<password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres`.
   - This is `DATABASE_URL`.
2. **Media bucket.** Go to Storage → **New bucket**, name it `media`, and make it **Public**.
   - Public read is what lets ImageKit fetch the originals. Uploads still need the S3 keys.
3. **Optional, recommended: database certificate.** Go to Database → Settings → **SSL Configuration** → download the CA certificate.
   - Its full PEM text becomes `DATABASE_CA_CERT` (DigitalOcean) and the `DATABASE_CA_CERT` GitHub secret (backups), so connections verify the database's identity, not just encrypt.
4. **S3 keys.** Go to Storage → Settings → **S3 Connection**.
   - Copy the **endpoint**. This is `S3_ENDPOINT`.
   - Create an **access key**. This gives you `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`.

## 2. ImageKit

1. Go to **External storage** → Add → **Web folder**.
   - Base URL: `https://<ref>.supabase.co/storage/v1/object/public/media/`
2. Attach that origin to the default URL endpoint. The endpoint is `https://ik.imagekit.io/<your-id>`, which is `IMAGEKIT_URL_ENDPOINT`.
   - Because media keys are stored as `media/<file>`, set the base URL to the bucket root: `.../object/public/media/` → `ik.imagekit.io/<id>/media/<file>`.

## 3. Prepare the database (from a laptop, before the app ever runs)

The first Super Admin is created now, so the app never boots with an open "create first user" page.

```bash
export DATABASE_URL='<session pooler string>'
export PAYLOAD_SECRET='<the production secret>'   # generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
export NODE_ENV=production DISABLE_JOBS=true
npm run migrate
SEED_ADMIN_EMAIL='you@example.com' SEED_ADMIN_PASSWORD='<long unique password>' SEED_ADMIN_NAME='Your Name' npm run seed
```

- This creates the tables, sections, categories, ad slots, standard pages and the Super Admin.
- Store `PAYLOAD_SECRET` in a password manager; the app uses the same value.
- **Never run `seed:demo` against production.**

## 4. DigitalOcean App Platform

1. Go to **Create App** → **GitHub** → `immza/clarity60`, branch `main`.
2. Use the spec in `.do/app.yaml` (paste it under App Spec).
   - It sets region `sfo`, the $10 1 GiB instance, a health check at `/healthz`, and alerts.
   - It deliberately adds **no custom domains**; see step 5.
3. Fill in every env var marked `SECRET` in the spec. `PAYLOAD_SECRET` must be the same value used in step 3.
4. Deploy.
   - **Check:** `https://<app>.ondigitalocean.app/healthz` returns `{"ok":true}`.
   - Don't log in on the `ondigitalocean.app` address: the admin only accepts sign-ins from `clarity60.com`. You'll log in and set up 2FA after step 5.

## 5. Cloudflare

1. **DNS:**
   - Replace the Namecheap parking **A** record and the `www` **CNAME**.
   - New records: `clarity60.com` **CNAME** `<app>.ondigitalocean.app`, and `www` **CNAME** `clarity60.com`.
   - Keep both **Proxied** (orange cloud).
   - **Do not add the domain inside App Platform**: with Cloudflare proxying, that breaks DigitalOcean's certificate renewal.
2. **SSL/TLS:**
   - Mode: **Full (strict)**.
   - Turn on **Always Use HTTPS**.
   - Set minimum TLS to **1.2**.
3. **Test it:** `https://clarity60.com/healthz` should return `{"ok":true}`.
   - **If it returns a 403/404 or error page:** DigitalOcean is not accepting the proxied hostname (Cloudflare's free plan can't rewrite the `Host` header). Use the fallback:
     1. Add both `clarity60.com` and `www.clarity60.com` as custom domains in App Platform.
     2. Set both Cloudflare records to **DNS only** (grey cloud) so App Platform can issue and renew its certificates.
     3. Leave them grey. App Platform's own CDN and DDoS protection then front the site, and Cloudflare provides DNS and email only.
     4. **What the fallback loses:** Cloudflare's WAF rate-limit rule, its page caching, AI Crawl Control and traffic analytics. **What still works:** the app's own login rate limit and account lockout, security headers, `www` → `clarity60.com` redirect (the app does it), HTTPS, and DigitalOcean's edge caching.
     5. Continue with step 4; skip steps 5–7 (they need the orange cloud).
4. **Log in and secure the admin:** go to `https://clarity60.com/admin`, sign in as the Super Admin from step 3, **change the password**, and set up 2FA. Save the authenticator backup.
5. **Optional: Rules → Redirect Rules.** The app already redirects `www` to `clarity60.com`; this only saves a round trip.
   - When the hostname equals `www.clarity60.com`, do a **Dynamic** redirect to `concat("https://clarity60.com", http.request.uri.path)`.
   - Status **301**, **preserve query string** on.
6. **Security → WAF → Rate limiting** (the free plan allows 1 rule):
   - URI path equals `/api/users/login`, 10 requests per 10 seconds per IP → Block.
7. **Caching:**
   - Leave the defaults; the app sends its own cache headers.
   - **Do not** cache `/admin*` or `/api/*`.
8. **Email Routing** (optional): `hello@` → Gmail.

## 6. After going live

1. In Admin → **Authors**, create your author profile with name, bio, credentials and photo.
2. Upload one image and confirm it loads from `ik.imagekit.io`.
3. Publish the launch articles: aim for 10–15.
4. **Google Search Console:**
   - Add the domain property. Verification is a Cloudflare DNS TXT record.
   - Submit `/sitemap.xml` and `/news-sitemap.xml`.
5. **Bing Webmaster Tools:** import from Search Console. Optionally set `INDEXNOW_KEY`.
6. **Backups:**
   - Add the GitHub repo secrets `BACKUP_DATABASE_URL` (the session pooler string) and `BACKUP_PASSPHRASE`. Keep the passphrase in a password manager; without it, backups cannot be read.
   - Run the workflow once by hand: Actions → Nightly database backup → Run.
   - Optionally add the `DATABASE_CA_CERT` repo secret so backups verify the database certificate.
   - Then run **Actions → Restore drill → Run**. It restores the newest backup into a throwaway database and prints the article count. Repeat monthly.
   - Each run checks in with Sentry's **Crons** monitor `nightly-db-backup`. If GitHub ever pauses the schedule (it does after 60 days with no repo activity), Sentry emails about the missed run.
7. **Sentry:** trigger nothing on purpose. Watch Issues for the first day.

## Later

- **GA4:** set `NEXT_PUBLIC_GA_ID`. The cookie banner appears automatically.
- **AdSense:**
  - Add its hosts to `ADS` in `src/lib/securityHeaders.ts`.
  - Set `NEXT_PUBLIC_ADSENSE_CLIENT`.
  - Switch slots to "AdSense" in Admin.
- **HSTS preload:** once the site has run on HTTPS for a few weeks, add `preload` and submit to hstspreload.org.
