# Deploy to Cloudflare (ohmetry.com)

The site is static. Production defaults already point at `https://ohmetry.com` at the root, so no environment variables are needed.

## Connect the repo
Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > `aminullah112-oss/Ohmetry`, branch `main`.

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `git fetch --unshallow \|\| true; npm test && npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |

The `git fetch --unshallow` step matters: each page's "Updated" date comes from `git log`, and Cloudflare clones shallow by default, which would stamp every page with the same date.
`npm test` runs the formula tests first, so a broken formula blocks the deploy.

## Attach the domain
Project > Custom domains > Set up a custom domain > `ohmetry.com`, then repeat for `www.ohmetry.com`.
Add a redirect rule (Rules > Redirect Rules) from `www.ohmetry.com/*` to `https://ohmetry.com/$1`, status 301.
SSL/TLS mode: Full (strict). Turn on Always Use HTTPS.

## After the first deploy
1. Open https://ohmetry.com/ and check a calculator, the sitemap (`/sitemap-index.xml`) and `robots.txt`.
2. Google Search Console: add the `ohmetry.com` domain property (DNS verification is one click when DNS is on Cloudflare), submit `sitemap-index.xml`.
3. Retire the GitHub Pages preview (delete `.github/workflows/pages.yml` and disable Pages in repo settings) so there is one copy of the site.

## If Cloudflare shows the Workers flow ("Create application")
`wrangler.jsonc` in the repo root already points static assets at `dist`, so the defaults work:
build command `git fetch --unshallow || true; npm test && npm run build`, deploy command `npx wrangler deploy`, variable `NODE_VERSION` = `22`.
Custom domains are added under the Worker's Settings > Domains & Routes.

## Deploy from GitHub Actions (what this repo uses)
`.github/workflows/deploy.yml` runs the tests, builds the site and runs `wrangler deploy` on every push to `main`. `wrangler.jsonc` also attaches `ohmetry.com` and `www.ohmetry.com` as custom domains.
Needs two repository secrets (Settings > Secrets and variables > Actions):
- `CLOUDFLARE_API_TOKEN`: create at dash.cloudflare.com/profile/api-tokens > Create Token > template "Edit Cloudflare Workers". Under Zone Resources pick All zones (or `ohmetry.com`).
- `CLOUDFLARE_ACCOUNT_ID`: shown on the Workers & Pages overview page, right-hand column.
Until both exist the deploy step is skipped with a warning; tests and build still run.

Deploys run automatically on every push to main (see .github/workflows/deploy.yml).

## SEO automation
- `npm run seo` audits the built site (titles, descriptions, canonicals, one h1, og images, broken internal links, sitemap against noindex). It runs on every deploy and a failure stops the deploy.
- `scripts/indexnow.mjs` pings IndexNow search engines (not Google) about pages changed in each push.
- `.github/workflows/gsc-report.yml` writes `docs/seo/gsc-report.md` every Monday from Search Console. One-time setup: in Google Cloud create a service account and a JSON key, add the service account's email as a user (restricted is enough) of the `ohmetry.com` property in Search Console, and save the JSON as the repository secret `GSC_SERVICE_ACCOUNT`. Set `GSC_SITE` only if the property is not `sc-domain:ohmetry.com`.

## Progress dashboard
`.github/workflows/dashboard.yml` builds a private-style dashboard (no search indexing) at `https://aminullah112-oss.github.io/Ohmetry/`, daily and on every push. It shows the SEO audit, site growth, Search Console clicks and impressions, Cloudflare visits, per-page performance by age and a change log. Data is saved in `docs/seo/*.json` so history builds up.
- One-time: repository Settings, Pages, Source: **GitHub Actions**.
- Search data: the `GSC_SERVICE_ACCOUNT` secret described above.
- Visits (optional): create a Cloudflare API token with Account Analytics Read, save it as the secret `CF_ANALYTICS_TOKEN`, and set the repository variable `CF_SITE_TAG` to the siteTag shown in the Web Analytics page address. The Cloudflare query has not been tested against a live token, so check the first run.
- The page is public to anyone who has the address. The numbers are not secret, but do not share it if you would rather keep them private.
