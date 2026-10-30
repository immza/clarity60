# Launch runbook

The order of steps for taking clarity60.com live. Secrets go into dashboards only, never into git or chat.

## 1. Supabase

1. **Database connection string.** In Supabase, go to Project → **Connect** → **Session pooler** and copy the string.
   - Use the session pooler, not "Direct connection". The direct connection is IPv6-only, and DigitalOcean App Platform needs IPv4.
   - The string looks like `postgresql://postgres.<ref>:<password>@aws-0-us-west-2.pooler.supabase.com:5432/postgres`.
   - This is `DATABASE_URL`.
2. **Media bucket.** Go to Storage → **New bucket**, name it `media`, and make it **Public**.
   - Public read is what lets ImageKit fetch the originals. Uploads still need the S3 keys.
3. **Database certificate (required).** Go to Database → Settings → **SSL Configuration** → download the CA certificate (e.g. `prod-ca-2021.crt`).
   - Its full text becomes `DATABASE_CA_CERT` in DigitalOcean and the `DATABASE_CA_CERT` GitHub secret.
   - The app, seed, backups and restore all refuse to connect to a remote database without it, so traffic is always encrypted and the database's identity is checked.
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
export DATABASE_CA_CERT="$(cat ~/Downloads/prod-ca-2021.crt)"   # the certificate from §1.3
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
   - It lists the two custom domains; DigitalOcean issues their certificates (step 5).
3. Fill in every env var marked `SECRET` in the spec. `PAYLOAD_SECRET` must be the same value used in step 3.
4. Deploy.
   - **Check:** `https://<app>.ondigitalocean.app/healthz` returns `{"ok":true}`.
   - Don't log in on the `ondigitalocean.app` address: the admin only accepts sign-ins from `clarity60.com`. You'll log in and set up 2FA after step 5.

## 5. Cloudflare

1. **App Platform → Networking → Domains:** add `clarity60.com` (primary) and `www.clarity60.com`, choosing **You manage your domain**.
2. **Cloudflare DNS:**
   - Replace the Namecheap parking **A** record and the `www` **CNAME**.
   - New records: `clarity60.com` **CNAME** `<app>.ondigitalocean.app`, and `www` **CNAME** `<app>.ondigitalocean.app`.
   - Set both to **DNS only** (grey cloud). App Platform already runs on Cloudflare's network; a proxied (orange) record in front of it fails with error 526.
   - Keep the MX and TXT records (email forwarding).
   - App Platform's own CDN and DDoS protection front the site, and it issues and renews the certificates. The app's login rate limit and account lockout, security headers, `www` → `clarity60.com` redirect and HTTPS all apply. Cloudflare's WAF rule, page caching, AI Crawl Control and traffic analytics need the orange cloud, so they are not used.
3. **Test it:** `https://clarity60.com/healthz` should return `{"ok":true}`, usually within minutes once the domains show **Active**.
4. **Log in and secure the admin:** go to `https://clarity60.com/admin`, sign in as the Super Admin from step 3, **change the password**, and set up 2FA. Save the authenticator backup.
5. **Email Routing** (optional): `hello@` → Gmail.

## 6. After going live

1. In Admin → **Authors**, create your author profile with name, bio, credentials and photo.
2. Upload one image and confirm it loads from `ik.imagekit.io`.
3. Publish the launch articles: aim for 10–15.
4. **Google Search Console:**
   - Add the domain property. Verification is a Cloudflare DNS TXT record.
   - Submit `/sitemap.xml` and `/news-sitemap.xml`.
5. **Bing Webmaster Tools:** import from Search Console. Optionally set `INDEXNOW_KEY`.
6. **Backups:**
   - Add the GitHub repo secrets `BACKUP_DATABASE_URL` (the session pooler string), `BACKUP_PASSPHRASE` and `DATABASE_CA_CERT`. Keep the passphrase in a password manager; without it, backups cannot be read.
   - Run the workflow once by hand: Actions → Nightly database backup → Run.
   - For a manual restore with `scripts/restore-backup.sh`, save the certificate to a file and pass it: `PGSSLROOTCERT=~/Downloads/prod-ca-2021.crt`.
   - Then run **Actions → Restore drill → Run**. It restores the newest backup into a throwaway database and prints the article count. Repeat monthly.
   - Each run checks in with Sentry's **Crons** monitor `nightly-db-backup`. If GitHub ever pauses the schedule (it does after 60 days with no repo activity), Sentry emails about the missed run.
7. **Sentry:** in Project Settings → **Security & Privacy**, turn on **Prevent Storing of IP Addresses** (the Privacy Policy promises error reports exclude IPs). Then watch Issues for the first day.
8. **Legal pages:** they present Clarity60 as the publisher, contact by email only, dated the day they are seeded. If a company is formed later, set `company`, `address` and `governingLaw` in `PUBLISHER` (`src/scripts/pageTemplates.ts`) and update the pages. After launch, edit them in Admin → Pages.
9. **Domain privacy:** confirm Namecheap → clarity60.com → **Domain Privacy** is ON, so no personal details show in WHOIS.

## Later

- **GA4:** set `NEXT_PUBLIC_GA_ID`. The cookie banner appears automatically.
- **AdSense:**
  - Add its hosts to `ADS` in `src/lib/securityHeaders.ts`.
  - Set `NEXT_PUBLIC_ADSENSE_CLIENT`.
  - Switch slots to "AdSense" in Admin.
- **HSTS preload:** once the site has run on HTTPS for a few weeks, add `preload` and submit to hstspreload.org.
