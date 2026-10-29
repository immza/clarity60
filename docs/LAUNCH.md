# Launch runbook

The order of steps for taking clarity60.com live. Secrets go into dashboards only, never into git or chat.

## 1. Supabase

1. **Database connection string.** In Supabase, go to Project → **Connect** → **Session pooler** and copy the string.
   - Use the session pooler, not "Direct connection". The direct connection is IPv6-only, and DigitalOcean App Platform needs IPv4.
   - The string looks like `postgresql://postgres.<ref>:<password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres`.
   - This is `DATABASE_URL`.
2. **Media bucket.** Go to Storage → **New bucket**, name it `media`, and make it **Public**.
   - Public read is what lets ImageKit fetch the originals. Uploads still need the S3 keys.
3. **S3 keys.** Go to Storage → Settings → **S3 Connection**.
   - Copy the **endpoint**. This is `S3_ENDPOINT`.
   - Create an **access key**. This gives you `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`.

## 2. ImageKit

1. Go to **External storage** → Add → **Web folder**.
   - Base URL: `https://<ref>.supabase.co/storage/v1/object/public/media/`
2. Attach that origin to the default URL endpoint. The endpoint is `https://ik.imagekit.io/<your-id>`, which is `IMAGEKIT_URL_ENDPOINT`.
   - Because media keys are stored as `media/<file>`, set the base URL to the bucket root: `.../object/public/media/` → `ik.imagekit.io/<id>/media/<file>`.

## 3. DigitalOcean App Platform

1. Go to **Create App** → **GitHub** → `immza/clarity60`, branch `main`.
2. Use the spec in `.do/app.yaml`. You can paste it under App Spec.
   - It sets region `sfo` and the $10 1 GiB instance, health check at `/healthz`.
3. Fill in every env var marked `SECRET` in the spec.
   - `PAYLOAD_SECRET`: generate it with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Store it in a password manager too.
4. Deploy.
   - The first boot applies the database migration automatically.
   - **Check:** `https://<app>.ondigitalocean.app/healthz` should return `{"ok":true}`.
5. Seed the structure. From a laptop, with `DATABASE_URL` pointing at Supabase:
   `NODE_ENV=production DISABLE_JOBS=true npm run seed`
   - This creates sections, categories, ad slots and the standard pages.
   - **Never run `seed:demo` against production.**

## 4. Cloudflare

1. **DNS:**
   - Replace the Namecheap parking **A** record and the `www` **CNAME** with DigitalOcean's records for the app's custom domains.
   - Use CNAMEs to `<app>.ondigitalocean.app`. CNAME flattening handles the apex.
   - Keep all of them **Proxied** (orange cloud).
2. **SSL/TLS:**
   - Mode: **Full (strict)**.
   - Turn on **Always Use HTTPS**.
   - Set minimum TLS to **1.2**.
3. **Rules → Redirect Rules:** `www.clarity60.com/*` → `https://clarity60.com/$1` (301).
4. **Security → WAF → Rate limiting** (the free plan allows 1 rule):
   - path `/api/users/login`, 10 requests per 10 seconds per IP → Block.
5. **Caching:**
   - Leave the defaults; the app sends its own cache headers.
   - **Do not** cache `/admin*` or `/api/*`.
6. **Email Routing** (optional): `hello@` → Gmail.

## 5. After first deploy

1. Create the first Super Admin at `/admin` and set up 2FA. Save the authenticator backup.
2. In Admin → **Authors**, create your author profile with name, bio, credentials and photo.
3. Upload one image and confirm it loads from `ik.imagekit.io`.
4. Publish the launch articles: aim for 10–15.
5. **Google Search Console:**
   - Add the domain property. Verification is a Cloudflare DNS TXT record.
   - Submit `/sitemap.xml` and `/news-sitemap.xml`.
6. **Bing Webmaster Tools:** import from Search Console. Optionally set `INDEXNOW_KEY`.
7. **Backups:**
   - Add the GitHub repo secrets `BACKUP_DATABASE_URL` (the session pooler string) and `BACKUP_PASSPHRASE`. Keep the passphrase in a password manager; without it, backups cannot be read.
   - Run the workflow once by hand: Actions → Nightly database backup → Run.
   - **Restore drill:** restore the artifact into a scratch database with `scripts/restore-backup.sh` and check the article count matches.
8. **Sentry:** trigger nothing on purpose. Watch Issues for the first day.

## Later

- **GA4:** set `NEXT_PUBLIC_GA_ID`. The cookie banner appears automatically.
- **AdSense:**
  - Add its hosts to `ADS` in `src/lib/securityHeaders.ts`.
  - Set `NEXT_PUBLIC_ADSENSE_CLIENT`.
  - Switch slots to "AdSense" in Admin.
- **HSTS preload:** once the site has run on HTTPS for a few weeks, add `preload` and submit to hstspreload.org.
